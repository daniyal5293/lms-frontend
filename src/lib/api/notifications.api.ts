import { apiFetch } from "@/src/lib/api/client";

export type NotificationPriority = "Normal" | "Important" | "Urgent";
export type NotificationAudience = "HODs" | "Teachers" | "Students";
export type NotificationScope = "All" | "Section" | "Selected";
export type NotificationStatus = "Queued" | "Processing" | "Processed" | "Failed";

/** A notification as seen by its recipient; also the SignalR ReceiveNotification payload. */
export type InboxNotification = {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  senderName: string;
  senderRole: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
};

export type InboxPage = {
  items: InboxNotification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
};

export type SendNotificationPayload = {
  title: string;
  message: string;
  priority: NotificationPriority;
  audience: NotificationAudience;
  scope: NotificationScope;
  sectionId?: string;
  recipientIds?: string[];
};

export type NotificationTargetOption = { id: string; label: string; detail?: string | null };

export type NotificationTargets = {
  senderRole: string;
  department?: string | null;
  audiences: Array<{ audience: NotificationAudience; scopes: NotificationScope[] }>;
  sections: NotificationTargetOption[];
  teachers: NotificationTargetOption[];
  hods: NotificationTargetOption[];
};

export type SentNotification = {
  id: string;
  title: string;
  audience: NotificationAudience;
  scope: NotificationScope;
  section?: string | null;
  senderName: string;
  senderRole: string;
  createdAt: string;
  status: NotificationStatus;
  attempts: number;
  nextAttemptAt?: string | null;
  processedAt?: string | null;
  lastError?: string | null;
  recipientCount: number;
  pending: number;
  attempted: number;
  acknowledged: number;
  failed: number;
  readCount: number;
};

export async function listNotifications(options: { unreadOnly?: boolean; page?: number; pageSize?: number } = {}) {
  const params = new URLSearchParams({
    unreadOnly: String(options.unreadOnly ?? false),
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 20),
  });
  return apiFetch<InboxPage>(`/api/notifications?${params}`);
}

export async function getUnreadCount() {
  const response = await apiFetch<{ count: number }>("/api/notifications/unread-count");
  return response.count;
}

export async function markNotificationRead(id: string) {
  return apiFetch<void>(`/api/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(ids?: string[]) {
  return apiFetch<{ updated: number }>("/api/notifications/read-all", {
    method: "POST",
    body: JSON.stringify({ ids: ids ?? null }),
  });
}

export async function sendNotification(payload: SendNotificationPayload) {
  return apiFetch<{ id: string; status: NotificationStatus; recipientCount: number }>("/api/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getNotificationTargets() {
  return apiFetch<NotificationTargets>("/api/notifications/targets");
}

export async function listSectionStudentsForNotification(sectionId: string) {
  return apiFetch<NotificationTargetOption[]>(`/api/notifications/targets/sections/${sectionId}/students`);
}

export async function listSentNotifications(page = 1, pageSize = 20) {
  return apiFetch<SentNotification[]>(`/api/notifications/sent?page=${page}&pageSize=${pageSize}`);
}

export async function retryNotification(id: string) {
  return apiFetch<SentNotification>(`/api/notifications/${id}/retry`, { method: "POST" });
}
