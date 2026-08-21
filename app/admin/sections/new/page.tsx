"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Select } from "@/src/components/ui/Select";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { listCourses } from "@/src/lib/api/courses.api";
import { createSection } from "@/src/lib/api/sections.api";
import { ApiError } from "@/src/lib/api/client";
import type { Course } from "@/src/lib/types";

const initialState = {
  Name: "",
  CourseId: "",
  Capacity: "",
};

export default function NewSectionPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listCourses();
        setCourses(data);
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Unable to load courses.";
        notify("error", "Course load failed", message);
      }
    };

    load();
  }, [notify]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.Name.trim() || !form.CourseId || !form.Capacity) {
      notify("error", "Validation failed", "Section name, course, and capacity are required.");
      return;
    }

    setSubmitting(true);

    try {
      await createSection({
        Name: form.Name,
        CourseId: form.CourseId,
        Capacity: Number(form.Capacity),
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
    <AppShell>
      <PageHeader title="Create Section" description="Assign a section to a valid course and set its seating capacity." />

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Section name" value={form.Name} onChange={(event) => setForm((current) => ({ ...current, Name: event.target.value }))} />
            <Select label="Course" value={form.CourseId} onChange={(event) => setForm((current) => ({ ...current, CourseId: event.target.value }))}>
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.Id ?? course.id ?? course.Code} value={course.Id ?? course.id ?? course.Code}>
                  {course.Name} ({course.Code})
                </option>
              ))}
            </Select>
            <Input label="Capacity" type="number" value={form.Capacity} onChange={(event) => setForm((current) => ({ ...current, Capacity: event.target.value }))} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={submitting}>{submitting ? "Saving..." : "Create Section"}</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
