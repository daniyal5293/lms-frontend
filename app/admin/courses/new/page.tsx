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
  CourseName: "",
  CourseDescription: "",
  CourseDuration: ""
};

export default function NewCoursePage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.CourseName.trim() || !form.CourseDuration.trim() || Number(form.CourseDuration) <= 0) {
      notify("error", "Validation failed", "Course name and duration are required.");
      return;
    }

    setSubmitting(true);

    try {
      await createCourse({
        courseName: form.CourseName.trim(),
        courseDescription: form.CourseDescription.trim(),
        courseDuration: Number(form.CourseDuration),
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
            <Input label="Course name" value={form.CourseName} onChange={(event) => setForm((current) => ({ ...current, CourseName: event.target.value }))} />
            <Input label="Duration" value={form.CourseDuration} onChange={(event) => setForm((current) => ({ ...current, CourseDuration: event.target.value }))} />
            <div className="md:col-span-2">
              <label className="block w-full text-sm text-white" htmlFor="course-description">
                <span className="mb-2 block text-[#d4d4d4]">Description</span>
                <textarea
                  id="course-description"
                  value={form.CourseDescription}
                  onChange={(event) => setForm((current) => ({ ...current, CourseDescription: event.target.value }))}
                  rows={5}
                  placeholder="Describe the course content and learning outcomes"
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2.5 text-white placeholder:text-[#888888] focus:border-[#FF6B35] focus:outline-none"
                />
              </label>
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
