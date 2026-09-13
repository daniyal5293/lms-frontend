"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { getSectionById, updateSection } from "@/src/lib/api/sections.api";
import { ApiError } from "@/src/lib/api/client";

const initialState = {
  sectionName: "",
  IntermediateClass: "",
  StartDate: "",
  IsActive: false,
};

export default function EditSectionPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const sectionId = routeParams.id;
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const section = await getSectionById(sectionId);
        setForm({
          sectionName: section.Name ?? section.sectionName ?? "",
          IntermediateClass: section.IntermediateClass ?? section.intermediateClass ?? "",
          StartDate: (section.StartDate ?? section.startDate ?? "").slice(0, 16),
          IsActive: section.IsActive ?? section.isActive ?? false,
        });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Unable to load section.";
        notify("error", "Section load failed", message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [notify, sectionId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await updateSection(sectionId, {
        sectionName: form.sectionName.trim(),
        IntermediateClass: form.IntermediateClass.trim(),
        StartDate: `${form.StartDate}:00`,
        IsActive: form.IsActive,
      });
      notify("success", "Section updated", "The section was saved successfully.");
      router.push(`/admin/sections/${sectionId}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to update section.";
      notify("error", "Update failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppShell><div className="py-10 text-center theme-text-muted">Loading section...</div></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Edit Section" description="Update the section name, class level, start date, and status." />

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Section name" value={form.sectionName} onChange={(event) => setForm((current) => ({ ...current, sectionName: event.target.value }))} />
            <Input label="Intermediate class" value={form.IntermediateClass} onChange={(event) => setForm((current) => ({ ...current, IntermediateClass: event.target.value }))} />
            <Input label="Start date" type="datetime-local" value={form.StartDate} onChange={(event) => setForm((current) => ({ ...current, StartDate: event.target.value }))} />
            <label className="flex items-center gap-3 text-sm theme-text-soft"><input type="checkbox" checked={form.IsActive} onChange={(event) => setForm((current) => ({ ...current, IsActive: event.target.checked }))} />Active section</label>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}

