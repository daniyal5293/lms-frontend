"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { getCourseById, updateCourse } from "@/src/lib/api/courses.api";
import { ApiError } from "@/src/lib/api/client";

const initialState = {
  Name: "",
  Code: "",
  Credits: "",
  Description: "",
};

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const course = await getCourseById(params.id);
        setForm({
          Name: course.Name ?? "",
          Code: course.Code ?? "",
          Credits: String(course.Credits ?? ""),
          Description: course.Description ?? "",
        });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Unable to load course.";
        notify("error", "Course load failed", message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [notify, params.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await updateCourse(params.id, {
        Name: form.Name,
        Code: form.Code,
        Credits: Number(form.Credits),
        Description: form.Description,
      });
      notify("success", "Course updated", "The course information was saved.");
      router.push(`/admin/courses/${params.id}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to update course.";
      notify("error", "Update failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppShell><div className="py-10 text-center text-[#888888]">Loading course...</div></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Edit Course" description="Update course details and curriculum metadata." />

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
            <Button type="submit" loading={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
