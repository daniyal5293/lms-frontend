import { apiFetch } from "@/src/lib/api/client";

export type Department = {
  departmentId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  teacherCount: number;
  studentCount: number;
};

export type SaveDepartmentPayload = {
  name: string;
  description?: string | null;
  isActive: boolean;
};

export async function listDepartments(activeOnly = false) {
  return apiFetch<Department[]>(`/api/departments?activeOnly=${activeOnly}`);
}

export async function createDepartment(payload: SaveDepartmentPayload) {
  return apiFetch<Department>("/api/departments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDepartment(id: string, payload: SaveDepartmentPayload) {
  return apiFetch<Department>(`/api/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteDepartment(id: string) {
  return apiFetch<void>(`/api/departments/${id}`, { method: "DELETE" });
}
