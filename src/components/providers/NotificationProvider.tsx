"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type NotificationType = "success" | "error" | "info";

type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
};

type NotificationContextValue = {
  notify: (type: NotificationType, title: string, message: string) => void;
  dismiss: (id: number) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notification[]>([]);

  const notify = useCallback((type: NotificationType, title: string, message: string) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({ notify, dismiss }),
    [notify, dismiss],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto rounded-xl border border-white/10 bg-[#1a1a1a] p-4 text-sm shadow-xl"
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="font-semibold text-white">{item.title}</span>
              <button
                type="button"
                className="text-[#888888] transition hover:text-white"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
            <p className="text-[#d4d4d4]">{item.message}</p>
            <div className="mt-3 h-1.5 rounded-full bg-white/5">
              <div
                className={
                  item.type === "success"
                    ? "h-full w-full rounded-full bg-[#FF6B35]"
                    : item.type === "error"
                      ? "h-full w-full rounded-full bg-red-500"
                      : "h-full w-full rounded-full bg-[#004E64]"
                }
              />
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }

  return context;
}
