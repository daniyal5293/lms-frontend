import { apiFetch } from "@/src/lib/api/client";
import type { Section } from "@/src/lib/types";

type RawSection = Section & {
  sectionId?: string;
  sectionName?: string;
  intermediateClass?: string;
  startDate?: string;
  isActive?: boolean;
};

function normalizeSection(section: RawSection): Section {
  return {
    ...section,
    Id: section.Id ?? section.id ?? section.sectionId ?? section.section_id,
    Name: section.Name ?? section.sectionName ?? "Unnamed section",
    IntermediateClass: section.IntermediateClass ?? section.intermediateClass,
    StartDate: section.StartDate ?? section.startDate,
    IsActive: section.IsActive ?? section.isActive,
  };
}

export async function listSections() {
  const sections = await apiFetch<RawSection[]>("/api/sections");
  return sections.map(normalizeSection);
}

export async function getSectionById(id: string) {
  const section = await apiFetch<RawSection>(`/api/sections/${id}`);
  return normalizeSection(section);
}

export async function createSection(payload: Record<string, unknown>) {
  return apiFetch<Section>("/api/sections", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSection(id: string, payload: Record<string, unknown>) {
  return apiFetch<Section>(`/api/sections/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSection(id: string) {
  return apiFetch<void>(`/api/sections/${id}`, { method: "DELETE" });
}
