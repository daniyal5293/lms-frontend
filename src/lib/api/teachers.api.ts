import { apiFetch } from "@/src/lib/api/client";
import type { Teacher } from "@/src/lib/types";

export async function createTeacher(payload: Record<string, unknown>) {
  return apiFetch<Teacher>("/api/admin/teachers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listTeachers() {
  return apiFetch<Teacher[]>("/api/admin/teachers");
}

export async function getTeacherById(id: string) {
  return apiFetch<Teacher>(`/api/admin/teachers/${id}`);
}

export async function updateTeacher(payload: Record<string, unknown>) {
  return apiFetch<Teacher>("/api/admin/teachers", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTeacher(id: string) {
  return apiFetch<void>(`/api/admin/teachers/${id}`, { method: "DELETE" });
}

export async function restoreTeacher(id: string) {
  return apiFetch<void>(`/api/admin/teachers/restore/${id}`, { method: "POST" });
}

export async function promoteTeacher(id: string) {
  return apiFetch<void>(`/api/admin/teachers/promotion/${id}`, { method: "POST" });
}

export async function demoteTeacher(id: string) {
  return apiFetch<void>(`/api/admin/teachers/demotion/${id}`, { method: "POST" });
}
