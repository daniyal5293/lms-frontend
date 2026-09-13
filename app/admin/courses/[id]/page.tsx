"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { getCourseById } from "@/src/lib/api/courses.api";
import type { Course } from "@/src/lib/types";

export default function CourseDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const courseId = Array.isArray(routeParams.id) ? routeParams.id[0] : routeParams.id;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCourseById(courseId);
        setCourse(data);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load course details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId]);

  if (loading) return <AppShell><div className="py-10 text-center theme-text-muted">Loading course details...</div></AppShell>;
  if (error) return <AppShell><div className="py-10 text-center text-red-300">{error}</div></AppShell>;
  if (!course) return <AppShell><div className="py-10 text-center theme-text-muted">Course not found.</div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title={course.Name}
        description="Course overview and summary."
        actions={<Button variant="secondary" onClick={() => router.push(`/admin/courses/${courseId}/edit`)}>Edit</Button>}
      />

      <Card>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="theme-text-muted">Course name</dt><dd className="text-white">{course.Name}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="theme-text-muted">Course code</dt><dd className="text-white">{course.Code}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="theme-text-muted">Credits</dt><dd className="text-white">{course.Credits}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="theme-text-muted">Description</dt><dd className="text-white">{course.Description ?? "Not provided"}</dd></div>
        </dl>
      </Card>
    </AppShell>
  );
}

