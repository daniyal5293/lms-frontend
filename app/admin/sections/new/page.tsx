"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { createSection } from "@/src/lib/api/sections.api";
import { ApiError } from "@/src/lib/api/client";

const initialState = {
  sectionName: "",
  IntermediateClass: "",
  StartDate: "",
  IsActive: false,
};

export default function NewSectionPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.sectionName.trim() || !form.IntermediateClass.trim() || !form.StartDate) {
      notify("error", "Validation failed", "Section name, class, and start date are required.");
      return;
    }

    setSubmitting(true);

    try {
      await createSection({
        sectionName: form.sectionName.trim(),
        IntermediateClass: form.IntermediateClass.trim(),
        StartDate: `${form.StartDate}:00`,
        IsActive: form.IsActive,
      });
      notify("success", "Section created", "The section was added successfully.");
      router.push("/admin/sections");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to create section.";
      notify("error", "Creation failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
      <PageHeader title="Create Section" description="Create a section with its class level, start date, and active state." />

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Section name" value={form.sectionName} onChange={(event) => setForm((current) => ({ ...current, sectionName: event.target.value }))} />
            <Input label="Intermediate class" placeholder="XI" value={form.IntermediateClass} onChange={(event) => setForm((current) => ({ ...current, IntermediateClass: event.target.value }))} />
            <Input label="Start date" type="datetime-local" value={form.StartDate} onChange={(event) => setForm((current) => ({ ...current, StartDate: event.target.value }))} />
            <label className="flex items-center gap-3 text-sm theme-text-soft">
              <input type="checkbox" checked={form.IsActive} onChange={(event) => setForm((current) => ({ ...current, IsActive: event.target.checked }))} />
              Active section
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={submitting}>{submitting ? "Saving..." : "Create Section"}</Button>
          </div>
        </form>
      </Card>
      </AppShell>
    </ProtectedRoute>
  );
}






