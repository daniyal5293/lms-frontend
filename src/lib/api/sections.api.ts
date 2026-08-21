import { apiFetch } from "@/src/lib/api/client";
import type { Section } from "@/src/lib/types";

export async function listSections() {
  return apiFetch<Section[]>("/api/sections");
}

export async function getSectionById(id: string) {
  return apiFetch<Section>(`/api/sections/${id}`);
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
