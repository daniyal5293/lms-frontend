import { apiDownload, apiFetch } from "@/src/lib/api/client";
import type { Student } from "@/src/lib/types";

function normalizeStudent(student: Student): Student {
  return {
    ...student,
    Id:
      student.Id ??
      student.id ??
      student.StudentEnrollmentId ??
      student.studentEnrollmentId ??
      student.EnrollmentId ??
      student.enrollmentId ??
      student.StudentId ??
      student.studentId ??
      student.student_id,
    FullName: student.FullName ?? student.fullName,
    Email: student.Email ?? student.email,
    SectionId: student.SectionId ?? student.sectionId,
  };
}

function getStudentArray(response: unknown): Student[] {
  if (Array.isArray(response)) return response.map(normalizeStudent);

  if (response && typeof response === "object") {
    const result = response as Record<string, unknown>;
    for (const key of ["students", "Students", "data", "Data", "items", "Items", "results", "Results", "$values"]) {
      if (key in result) return getStudentArray(result[key]);
    }
  }

  throw new Error("The server returned an invalid student list.");
}

export type CreateStudentPayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  enrollmentDate: string;
  cnic: string;
  sectionId: string;
};

export async function createStudent(payload: CreateStudentPayload) {
  return apiFetch<Student>("/api/student", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listStudents() {
  const response = await apiFetch<unknown>("/api/student");
  return getStudentArray(response);
}

export async function getStudentById(id: string) {
  const student = await apiFetch<Student>(`/api/student/${id}`);
  return normalizeStudent(student);
}

export async function listStudentsBySectionId(sectionId: string) {
  const response = await apiFetch<unknown>(`/api/student/section/${encodeURIComponent(sectionId)}`);
  return getStudentArray(response);
}

export async function updateStudent(id: string, payload: CreateStudentPayload) {
  return apiFetch<Student>(`/api/student/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteStudent(id: string) {
  return apiFetch<void>(`/api/student/${id}`, { method: "DELETE" });
}

export async function exportStudents() {
  return apiDownload("/api/student/export");
}