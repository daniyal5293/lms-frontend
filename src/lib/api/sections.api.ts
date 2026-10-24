import { apiFetch } from "@/src/lib/api/client";
import type { Section } from "@/src/lib/types";
import { formatSectionLabel } from "@/src/lib/utils";

type RawSection = Section & {
  sectionId?: string;
  SectionId?: string;
  sectionName?: string;
  SectionName?: string;
  intermediateClass?: string;
  startDate?: string;
  isActive?: boolean;
};

function normalizeSection(section: RawSection): Section {
  const sectionName = section.Name ?? section.sectionName ?? section.SectionName ?? "Unnamed section";
  const intermediateClass = section.IntermediateClass ?? section.intermediateClass;
  return {
    ...section,
    Id: section.Id ?? section.id ?? section.sectionId ?? section.SectionId ?? section.section_id,
    sectionName,
    IntermediateClass: intermediateClass,
    Name: formatSectionLabel({ Name: sectionName, IntermediateClass: intermediateClass }, sectionName),
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
