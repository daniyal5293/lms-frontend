"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { getCourseById } from "@/src/lib/api/courses.api";
import type { Course } from "@/src/lib/types";

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCourseById(params.id);
        setCourse(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id]);

  if (loading) return <AppShell><div className="py-10 text-center text-[#888888]">Loading course details...</div></AppShell>;
  if (!course) return <AppShell><div className="py-10 text-center text-[#888888]">Course not found.</div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title={course.Name}
        description="Course overview and summary."
        actions={<Button variant="secondary" onClick={() => router.push(`/admin/courses/${params.id}/edit`)}>Edit</Button>}
      />

      <Card>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-[#888888]">Course name</dt><dd className="text-white">{course.Name}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-[#888888]">Course code</dt><dd className="text-white">{course.Code}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-[#888888]">Credits</dt><dd className="text-white">{course.Credits}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-[#888888]">Description</dt><dd className="text-white">{course.Description ?? "Not provided"}</dd></div>
        </dl>
      </Card>
    </AppShell>
  );
}
