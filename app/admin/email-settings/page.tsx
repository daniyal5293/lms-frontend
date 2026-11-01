"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { ApiError } from "@/src/lib/api/client";
import { getEmailSettings, saveEmailSettings, sendTestEmail, type EmailSettings } from "@/src/lib/api/emailSettings.api";
import { formatDateTime } from "@/src/lib/utils";

type FormState = { smtpServer: string; smtpPort: string; senderEmail: string; senderName: string; appPassword: string };

const emptyForm: FormState = { smtpServer: "", smtpPort: "587", senderEmail: "", senderName: "", appPassword: "" };

const toForm = (settings: EmailSettings): FormState => ({
  smtpServer: settings.smtpServer,
  smtpPort: String(settings.smtpPort),
  senderEmail: settings.senderEmail,
  senderName: settings.senderName,
  appPassword: "",
});

export default function EmailSettingsPage() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [saved, setSaved] = useState<EmailSettings | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const settings = await getEmailSettings();
      setSaved(settings);
      setForm(toForm(settings));
    } catch (reason) {
      notify("error", "Email settings failed", reason instanceof ApiError ? reason.message : "Unable to load the email settings.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const update = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const same = (a?: string, b?: string) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

  // The server refuses to reuse the saved password for a different server or account
  const needsPasswordAgain =
    Boolean(saved?.hasPassword) && (!same(form.smtpServer, saved?.smtpServer) || !same(form.senderEmail, saved?.senderEmail));

  const dirty =
    saved !== null &&
    (form.smtpServer !== saved.smtpServer ||
      form.smtpPort !== String(saved.smtpPort) ||
      form.senderEmail !== saved.senderEmail ||
      form.senderName !== saved.senderName ||
      form.appPassword !== "");

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const settings = await saveEmailSettings({
        smtpServer: form.smtpServer.trim(),
        smtpPort: Number(form.smtpPort),
        senderEmail: form.senderEmail.trim(),
        senderName: form.senderName.trim(),
        appPassword: form.appPassword || undefined,
      });
      setSaved(settings);
      setForm(toForm(settings));
      notify("success", "Email settings saved", "New emails will use these settings.");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Unable to save the email settings.");
    } finally {
      setSaving(false);
    }
  };

  const testAddress = recipient || user?.Email || "";

  const sendTest = async () => {
    setTesting(true);
    try {
      const result = await sendTestEmail(testAddress.trim());
      notify("success", "Test email sent", result.message);
    } catch (reason) {
      notify("error", "Test email failed", reason instanceof ApiError ? reason.message : "Unable to send the test email.");
    } finally {
      setTesting(false);
    }
  };

  const testHint = !saved?.hasPassword
    ? "Save an app password first."
    : dirty
      ? "Save your changes first. The test uses the saved settings."
      : "Sends a short message using the saved settings.";

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader
          title="Email Setup"
          description="The mail account used for password resets and other system emails."
          actions={
            !loading && saved ? (
              <Badge tone={saved.hasPassword ? "success" : "warning"}>{saved.hasPassword ? "Password saved" : "Password needed"}</Badge>
            ) : null
          }
        />

        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Card>
            <form onSubmit={save} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
                <Input label="SMTP server" name="smtpServer" value={form.smtpServer} onChange={update("smtpServer")} placeholder="smtp.gmail.com" required disabled={loading} />
                <Input label="Port" name="smtpPort" type="number" min={1} max={65535} value={form.smtpPort} onChange={update("smtpPort")} required disabled={loading} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Sender email" name="senderEmail" type="email" value={form.senderEmail} onChange={update("senderEmail")} required disabled={loading} />
                <Input label="Sender name" name="senderName" value={form.senderName} onChange={update("senderName")} required disabled={loading} />
              </div>
              <div>
                <Input
                  label="App password"
                  name="appPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.appPassword}
                  onChange={update("appPassword")}
                  placeholder={saved?.hasPassword ? "••••••••••••••••" : "Enter the app password"}
                  required={needsPasswordAgain || (saved !== null && !saved.hasPassword)}
                  disabled={loading}
                />
                <p className="mt-1 text-xs theme-text-muted">
                  {needsPasswordAgain
                    ? "You changed the server or sender email, so enter the password for that account."
                    : saved?.hasPassword
                      ? "Saved and encrypted. It cannot be viewed. Leave this blank to keep it."
                      : "Stored encrypted. It cannot be viewed after saving."}
                </p>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs theme-text-muted">{saved?.updatedAt ? `Last saved ${formatDateTime(saved.updatedAt)}` : ""}</p>
                <Button type="submit" loading={saving} disabled={loading || !dirty}>
                  Save settings
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold theme-text">Send Test Email</h2>
            <p className="mt-0.5 mb-2.5 text-xs theme-text-muted">{testHint}</p>
            <div className="space-y-2.5">
              <Input label="Send to" name="recipient" type="email" value={testAddress} onChange={(event) => setRecipient(event.target.value)} disabled={loading} />
              <Button type="button" variant="secondary" className="w-full" loading={testing} disabled={loading || dirty || !saved?.hasPassword || !testAddress.trim()} onClick={sendTest}>
                Send Test Email
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
