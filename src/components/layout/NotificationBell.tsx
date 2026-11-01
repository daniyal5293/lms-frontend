"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useNotificationCenter } from "@/src/components/providers/NotificationCenterProvider";
import { cn, formatRelativeTime } from "@/src/lib/utils";

const PREVIEW_COUNT = 8;

export function NotificationBell() {
  const { items, unreadCount, connectionState, markRead, markAllRead } = useNotificationCenter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const live = connectionState === "connected";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-xl border border-black/10 bg-transparent p-2 theme-text transition hover:bg-black/5"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-black/10 theme-bg-surface shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold theme-text">Notifications</p>
              <p className="flex items-center gap-1.5 text-[11px] theme-text-muted">
                <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-emerald-500" : "bg-amber-500")} />
                {live ? "Live" : connectionState === "reconnecting" ? "Reconnecting..." : "Offline — showing saved notifications"}
              </p>
            </div>
            {unreadCount > 0 ? (
              <button type="button" onClick={() => void markAllRead()} className="text-xs theme-text-primary underline underline-offset-4">
                Mark all read
              </button>
            ) : null}
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm theme-text-muted">No notifications yet.</li>
            ) : (
              items.slice(0, PREVIEW_COUNT).map((item) => (
                <li key={item.id} className="border-b border-black/5 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => void markRead(item.id)}
                    className={cn("flex w-full gap-3 px-4 py-3 text-left transition hover:bg-black/5", !item.isRead && "theme-bg-primary-tint")}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.isRead ? "bg-transparent" : "theme-bg-primary")} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={cn("truncate text-sm theme-text", !item.isRead && "font-semibold")}>{item.title}</span>
                        {item.priority !== "Normal" ? (
                          <span className={cn("shrink-0 text-[10px] font-semibold uppercase", item.priority === "Urgent" ? "text-red-700" : "text-amber-800")}>
                            {item.priority}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs theme-text-soft">{item.message}</span>
                      <span className="mt-1 block text-[11px] theme-text-muted">
                        {item.senderName} · {item.senderRole} · {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-black/10 px-4 py-2.5 text-center text-sm theme-text-primary hover:bg-black/5"
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}
