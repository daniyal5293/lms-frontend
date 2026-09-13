"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { getSectionById } from "@/src/lib/api/sections.api";
import type { Section } from "@/src/lib/types";

export default function SectionDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const sectionId = routeParams.id;
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSectionById(sectionId);
        setSection(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [sectionId]);

  if (loading) return <AppShell><div className="py-10 text-center theme-text-muted">Loading section...</div></AppShell>;
  if (!section) return <AppShell><div className="py-10 text-center theme-text-muted">Section not found.</div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title={section.Name ?? section.sectionName ?? "Section"}
        description="Section overview and course relationship."
        actions={<Button variant="secondary" onClick={() => router.push(`/admin/sections/${sectionId}/edit`)}>Edit</Button>}
      />

      <Card>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="theme-text-muted">Name</dt><dd className="text-white">{section.Name ?? section.sectionName ?? "Not provided"}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="theme-text-muted">Intermediate class</dt><dd className="text-white">{section.IntermediateClass ?? section.intermediateClass ?? "Not provided"}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="theme-text-muted">Start date</dt><dd className="text-white">{section.StartDate ?? section.startDate ?? "Not provided"}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="theme-text-muted">Status</dt><dd className="text-white">{section.IsActive ?? section.isActive ? "Active" : "Inactive"}</dd></div>
        </dl>
      </Card>
    </AppShell>
  );
}

