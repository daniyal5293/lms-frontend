import { apiFetch } from "@/src/lib/api/client";

/** Admin-managed lists students are assigned to. */
export type LookupKind = "cohorts" | "campuses";

export type LookupItem = {
  id: string;
  name: string;
  isActive: boolean;
  studentCount: number;
};

export type SaveLookupPayload = { name: string; isActive: boolean };

export async function listLookups(kind: LookupKind, activeOnly = false) {
  return apiFetch<LookupItem[]>(`/api/${kind}?activeOnly=${activeOnly}`);
}

export async function createLookup(kind: LookupKind, payload: SaveLookupPayload) {
  return apiFetch<LookupItem>(`/api/${kind}`, { method: "POST", body: JSON.stringify(payload) });
}

export async function updateLookup(kind: LookupKind, id: string, payload: SaveLookupPayload) {
  return apiFetch<LookupItem>(`/api/${kind}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteLookup(kind: LookupKind, id: string) {
  return apiFetch<void>(`/api/${kind}/${id}`, { method: "DELETE" });
}
