"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { createCourse } from "@/src/lib/api/courses.api";
import { ApiError } from "@/src/lib/api/client";

const initialState = {
  Name: "",
  Code: "",
  Credits: "",
  Description: "",
};

export default function NewCoursePage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.Name.trim() || !form.Code.trim() || !form.Credits) {
      notify("error", "Validation failed", "Course name, code, and credits are required.");
      return;
    }

    setSubmitting(true);

    try {
      await createCourse({
        Name: form.Name,
        Code: form.Code,
        Credits: Number(form.Credits),
        Description: form.Description,
      });
      notify("success", "Course created", "The course was added successfully.");
      router.push("/admin/courses");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to create course.";
      notify("error", "Creation failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Create Course" description="Add a new course to the curriculum catalog." />

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Course name" value={form.Name} onChange={(event) => setForm((current) => ({ ...current, Name: event.target.value }))} />
            <Input label="Course code" value={form.Code} onChange={(event) => setForm((current) => ({ ...current, Code: event.target.value }))} />
            <Input label="Credits" type="number" value={form.Credits} onChange={(event) => setForm((current) => ({ ...current, Credits: event.target.value }))} />
            <div className="md:col-span-2">
              <Input label="Description" value={form.Description} onChange={(event) => setForm((current) => ({ ...current, Description: event.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={submitting}>{submitting ? "Saving..." : "Create Course"}</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
