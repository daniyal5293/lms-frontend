import { apiFetch } from "@/src/lib/api/client";
import type { Attendance, AttendanceStatus, AttendanceSummary } from "@/src/lib/types";

export type BulkAttendancePayload = {
  TeacherSectionCourseId: string;
  AttendanceDate: string;
  Entries: { StudentEnrollmentId: string; Status: AttendanceStatus; Remarks?: string }[];
};

export async function getCourseAttendance(id: string, date: string) {
  return apiFetch<Attendance[]>(`/api/attendance/course/${id}?date=${encodeURIComponent(date)}`);
}

export async function markBulkAttendance(payload: BulkAttendancePayload) {
  return apiFetch<unknown>("/api/attendance/bulk", { method: "POST", body: JSON.stringify(payload) });
}

export async function getCourseAttendanceSummary(id: string, from: string, to: string) {
  return apiFetch<AttendanceSummary[]>(`/api/attendance/course/${id}/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export async function listAttendance() {
  return apiFetch<Attendance[]>("/api/attendance");
}