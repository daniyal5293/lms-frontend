"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { getSectionById } from "@/src/lib/api/sections.api";
import type { Section } from "@/src/lib/types";

export default function SectionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSectionById(params.id);
        setSection(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id]);

  if (loading) return <AppShell><div className="py-10 text-center text-[#888888]">Loading section...</div></AppShell>;
  if (!section) return <AppShell><div className="py-10 text-center text-[#888888]">Section not found.</div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title={section.Name}
        description="Section overview and course relationship."
        actions={<Button variant="secondary" onClick={() => router.push(`/admin/sections/${params.id}/edit`)}>Edit</Button>}
      />

      <Card>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-[#888888]">Name</dt><dd className="text-white">{section.Name}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-[#888888]">Course</dt><dd className="text-white">{section.Course?.Name ?? section.CourseId}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-[#888888]">Capacity</dt><dd className="text-white">{section.Capacity}</dd></div>
        </dl>
      </Card>
    </AppShell>
  );
}
