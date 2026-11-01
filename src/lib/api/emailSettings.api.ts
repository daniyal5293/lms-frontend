import { apiFetch } from "@/src/lib/api/client";

/** The backend never returns the password; hasPassword only says that one is saved. */
export type EmailSettings = {
  smtpServer: string;
  smtpPort: number;
  senderEmail: string;
  senderName: string;
  hasPassword: boolean;
  updatedAt?: string | null;
};

export type SaveEmailSettingsPayload = {
  smtpServer: string;
  smtpPort: number;
  senderEmail: string;
  senderName: string;
  /** Leave empty to keep the saved password. */
  appPassword?: string;
};

export async function getEmailSettings() {
  return apiFetch<EmailSettings>("/api/admin/email-settings");
}

export async function saveEmailSettings(payload: SaveEmailSettingsPayload) {
  return apiFetch<EmailSettings>("/api/admin/email-settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function sendTestEmail(recipientEmail: string) {
  return apiFetch<{ message: string }>("/api/admin/email-settings/test", {
    method: "POST",
    body: JSON.stringify({ recipientEmail }),
  });
}
