"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { buildApiUrl, getStoredAccessToken, refreshAccessToken } from "@/src/lib/api/client";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type InboxNotification,
} from "@/src/lib/api/notifications.api";

const HUB_PATH = "/hubs/notifications";
const PAGE_SIZE = 20;

type ConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

type NotificationCenterValue = {
  items: InboxNotification[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  connectionState: ConnectionState;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationCenterContext = createContext<NotificationCenterValue | undefined>(undefined);

function isExpiringSoon(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 - Date.now() < 60_000;
  } catch {
    return false;
  }
}

/** Called on every (re)connect, so a long-lived tab reconnects with a fresh token. */
async function getFreshAccessToken() {
  const token = getStoredAccessToken();
  if (token && !isExpiringSoon(token)) return token;
  try {
    return await refreshAccessToken();
  } catch {
    return token ?? "";
  }
}

function mergeNewestFirst(incoming: InboxNotification[], existing: InboxNotification[]) {
  const byId = new Map<string, InboxNotification>();
  [...existing, ...incoming].forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Keeps the signed-in user's notifications in sync: loads history from the API (the source of truth),
 * listens for ReceiveNotification pushes over SignalR, and reloads after reconnecting so nothing is missed.
 */
export function NotificationCenterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadedPages, setLoadedPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const seenIds = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const page = await listNotifications({ page: 1, pageSize: PAGE_SIZE });
      page.items.forEach((item) => seenIds.current.add(item.id));
      setItems((current) => mergeNewestFirst(page.items, current));
      setUnreadCount(page.unreadCount);
      setTotal(page.total);
      setLoadedPages((current) => Math.max(current, 1));
    } catch {
      // The bell stays usable with what it has; the next refresh or reconnect will retry
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const page = await listNotifications({ page: loadedPages + 1, pageSize: PAGE_SIZE });
      page.items.forEach((item) => seenIds.current.add(item.id));
      setItems((current) => mergeNewestFirst(page.items, current));
      setUnreadCount(page.unreadCount);
      setTotal(page.total);
      setLoadedPages((current) => current + 1);
    } finally {
      setLoading(false);
    }
  }, [loadedPages]);

  useEffect(() => {
    if (!user?.Id) return;

    let disposed = false;
    let retryTimer: number | undefined;

    const connection = new HubConnectionBuilder()
      .withUrl(buildApiUrl(HUB_PATH), { accessTokenFactory: getFreshAccessToken })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) => Math.min(30_000, 1_000 * 2 ** context.previousRetryCount),
      })
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("ReceiveNotification", (notification: InboxNotification) => {
      // Confirm receipt even for duplicates; the server only records the first acknowledgement
      void connection.invoke("AcknowledgeNotification", notification.id).catch(() => undefined);

      if (seenIds.current.has(notification.id)) return;
      seenIds.current.add(notification.id);
      setItems((current) => mergeNewestFirst([notification], current));
      setUnreadCount((current) => current + 1);
      setTotal((current) => current + 1);
      notify("info", notification.title, notification.message);
    });

    connection.onreconnecting(() => setConnectionState("reconnecting"));
    connection.onreconnected(() => {
      setConnectionState("connected");
      void refresh();
    });
    connection.onclose(() => {
      if (!disposed) setConnectionState("disconnected");
    });

    const start = async (attempt: number) => {
      if (disposed) return;
      setConnectionState("connecting");
      try {
        await connection.start();
        if (disposed) return;
        setConnectionState("connected");
        // Pick up anything sent while we were not connected
        void refresh();
      } catch {
        if (disposed) return;
        setConnectionState("disconnected");
        retryTimer = window.setTimeout(() => void start(attempt + 1), Math.min(30_000, 2_000 * 2 ** attempt));
      }
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    void start(0);

    const seen = seenIds.current;
    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      void connection.stop();
      // Signed out or switched user: forget the previous user's notifications
      seen.clear();
      setItems([]);
      setUnreadCount(0);
      setTotal(0);
      setLoadedPages(0);
      setConnectionState("idle");
    };
  }, [notify, refresh, user?.Id]);

  const markRead = useCallback(async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target || target.isRead) return;

    setItems((current) => current.map((item) => (item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item)));
    setUnreadCount((current) => Math.max(0, current - 1));
    try {
      await markNotificationRead(id);
    } catch {
      void refresh();
    }
  }, [items, refresh]);

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString();
    setItems((current) => current.map((item) => (item.isRead ? item : { ...item, isRead: true, readAt })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      void refresh();
    }
  }, [refresh]);

  const value = useMemo<NotificationCenterValue>(
    () => ({
      items,
      unreadCount,
      total,
      hasMore: items.length < total,
      loading,
      connectionState,
      refresh,
      loadMore,
      markRead,
      markAllRead,
    }),
    [items, unreadCount, total, loading, connectionState, refresh, loadMore, markRead, markAllRead],
  );

  return <NotificationCenterContext.Provider value={value}>{children}</NotificationCenterContext.Provider>;
}

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext);

  if (!context) {
    throw new Error("useNotificationCenter must be used within NotificationCenterProvider");
  }

  return context;
}
