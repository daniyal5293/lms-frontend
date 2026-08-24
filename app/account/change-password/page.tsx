"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { changePassword } from "@/src/lib/api/auth.api";
import { ApiError } from "@/src/lib/api/client";

const initialState = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ChangePasswordPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      notify("error", "Validation failed", "All password fields are required.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      notify("error", "Validation failed", "New password and confirmation must match.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(form.currentPassword, form.newPassword, form.confirmPassword);
      notify("success", "Password changed", "Your password was updated successfully.");
      setForm(initialState);
      router.push("/dashboard");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to change your password.";
      notify("error", "Password change failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader title="Change password" description="Update the password for your LMS account." />
        <Card className="max-w-xl">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <Input label="Current password" type="password" autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))} />
            <Input label="New password" type="password" autoComplete="new-password" value={form.newPassword} onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))} />
            <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" loading={submitting}>{submitting ? "Updating..." : "Update password"}</Button>
            </div>
          </form>
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}