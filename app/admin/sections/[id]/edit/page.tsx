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
import { getSectionById, updateSection } from "@/src/lib/api/sections.api";
import { ApiError } from "@/src/lib/api/client";
import type { Course } from "@/src/lib/types";

const initialState = {
  Name: "",
  CourseId: "",
  Capacity: "",
};

export default function EditSectionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [section, courseData] = await Promise.all([getSectionById(params.id), listCourses()]);
        setCourses(courseData);
        setForm({
          Name: section.Name ?? "",
          CourseId: section.CourseId ?? "",
          Capacity: String(section.Capacity ?? ""),
        });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Unable to load section.";
        notify("error", "Section load failed", message);
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
      await updateSection(params.id, {
        Name: form.Name,
        CourseId: form.CourseId,
        Capacity: Number(form.Capacity),
      });
      notify("success", "Section updated", "The section was saved successfully.");
      router.push(`/admin/sections/${params.id}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to update section.";
      notify("error", "Update failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppShell><div className="py-10 text-center text-[#888888]">Loading section...</div></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Edit Section" description="Update the section name, course assignment, and capacity." />

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
            <Button type="submit" loading={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
