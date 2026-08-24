"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { listSections, deleteSection } from "@/src/lib/api/sections.api";
import { ApiError } from "@/src/lib/api/client";
import type { Section } from "@/src/lib/types";

export default function AdminSectionsPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [sections, setSections] = useState<Section[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sectionData = await listSections();
      setSections(sectionData);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to load sections.";
      notify("error", "Section load failed", message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const filteredSections = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return sections;
    return sections.filter((section) => {
      return `${section.Name ?? section.sectionName ?? ""} ${section.IntermediateClass ?? section.intermediateClass ?? ""} ${section.StartDate ?? section.startDate ?? ""}`.toLowerCase().includes(value);
    });
  }, [query, sections]);

  const handleDelete = async (section: Section) => {
    const id = section.Id ?? section.id ?? section.sectionId ?? section.section_id;
    if (!id) return;
    const confirmed = window.confirm(`Delete section ${section.Name ?? section.sectionName}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteSection(id);
      notify("success", "Section deleted", "The section was removed successfully.");
      loadData();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to delete section.";
      notify("error", "Deletion failed", message);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader
        title="Sections"
        description="Manage academic sections, class levels, start dates, and status."
        actions={<Button variant="primary" onClick={() => router.push("/admin/sections/new")}>Create Section</Button>}
      />

      <Card className="mb-6">
        <div className="max-w-md">
          <Input
            label="Search"
            placeholder="Search by name or course"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </Card>

      <Card>
        {loading ? <div className="text-sm text-[#888888]">Loading sections...</div> : filteredSections.length === 0 ? (
          <div className="py-8 text-center">
            <h3 className="text-lg font-semibold text-white">No sections found</h3>
            <p className="mt-2 text-sm text-[#888888]">There are currently no sections available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-3 py-3 font-medium text-[#888888]">Section</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Class</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Start date</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Status</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSections.map((section) => {
                  const sectionId = section.Id ?? section.id ?? section.sectionId ?? section.section_id ?? section.Name ?? section.sectionName ?? "section";
                  const sectionName = section.Name ?? section.sectionName ?? "Unnamed section";
                  const intermediateClass = section.IntermediateClass ?? section.intermediateClass ?? "Not provided";
                  const startDate = section.StartDate ?? section.startDate;
                  const isActive = section.IsActive ?? section.isActive ?? false;
                  return (
                    <tr key={sectionId} className="border-b border-white/5">
                      <td className="px-3 py-3 font-medium text-white">{sectionName}</td>
                      <td className="px-3 py-3 text-[#d4d4d4]">{intermediateClass}</td>
                      <td className="px-3 py-3 text-[#d4d4d4]">{startDate ? new Date(startDate).toLocaleString() : "Not provided"}</td>
                      <td className="px-3 py-3 text-[#d4d4d4]">{isActive ? "Active" : "Inactive"}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => router.push(`/admin/sections/${sectionId}`)} className="text-[#FF6B35] underline underline-offset-4">View</button>
                          <button type="button" onClick={() => router.push(`/admin/sections/${sectionId}/edit`)} className="text-[#d4d4d4] underline underline-offset-4">Edit</button>
                          <button type="button" onClick={() => handleDelete(section)} className="text-red-300 underline underline-offset-4">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
