import { apiFetch } from "@/src/lib/api/client";
import type { Teacher } from "@/src/lib/types";

function normalizeTeacher(teacher: Teacher): Teacher {
  return {
    ...teacher,
    Id: teacher.Id ?? teacher.id ?? teacher.teacher_id,
    Fullname: teacher.Fullname ?? teacher.FullName ?? teacher.fullname,
    FullName: teacher.FullName ?? teacher.Fullname ?? teacher.fullname,
    Email: teacher.Email ?? teacher.email,
    Department: teacher.Department ?? teacher.department,
    Salary: teacher.Salary ?? teacher.salary,
    CNIC: teacher.CNIC ?? teacher.cnic,
    DateOfBirth: teacher.DateOfBirth ?? teacher.dateOfBirth,
    HireDate: teacher.HireDate ?? teacher.hireDate,
    IdentificationNumber: teacher.IdentificationNumber ?? teacher.identificationNumber,
    Qualification: teacher.Qualification ?? teacher.qualification,
    Address: teacher.Address ?? teacher.address,
    Active: teacher.Active ?? teacher.IsActive ?? teacher.isActive,
    Role: teacher.Role ?? teacher.role,
  };
}

export async function createTeacher(payload: Record<string, unknown>) {
  return apiFetch<Teacher>("/api/admin/teachers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listTeachers() {
  const teachers = await apiFetch<Teacher[]>("/api/admin/teachers");
  return teachers.map(normalizeTeacher);
}

export async function getTeacherById(id: string) {
  const teacher = await apiFetch<Teacher>(`/api/admin/teachers/${id}`);
  return normalizeTeacher(teacher);
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
