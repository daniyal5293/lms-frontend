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
  const students = await apiFetch<Student[]>("/api/student");
  return students.map(normalizeStudent);
}

export async function getStudentById(id: string) {
  const student = await apiFetch<Student>(`/api/student/${id}`);
  return normalizeStudent(student);
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