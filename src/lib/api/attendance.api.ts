import { apiFetch } from "@/src/lib/api/client";
import type {
  Attendance,
  AttendanceStatus,
  AttendanceSummary,
  StudentAttendanceCourse,
} from "@/src/lib/types";

export type BulkAttendancePayload = {
  TeacherSectionCourseId: string;
  AttendanceDate: string;
  Entries: { StudentEnrollmentId: string; Status: AttendanceStatus; Remarks?: string }[];
};

export type BulkAttendanceResult = {
  RecordsCreated?: number;
  RecordsUpdated?: number;
  RecordsSkipped?: number;
  Errors?: string[];
};

const attendanceStatusValue: Record<AttendanceStatus, number> = {
  Present: 0,
  Absent: 1,
  Late: 2,
  Leave: 3,
};

type RawAttendance = Partial<Attendance> & {
  attendanceId?: string;
  studentEnrollmentId?: string;
  studentId?: string;
  studentFullName?: string | null;
  teacherSectionCourseId?: string;
  sectionId?: string;
  sectionName?: string | null;
  courseId?: string;
  courseName?: string | null;
  attendanceDate?: string;
  status?: AttendanceStatus | number;
  remarks?: string | null;
};

const statusNames: AttendanceStatus[] = ["Present", "Absent", "Late", "Leave"];

function normalizeStatus(status: RawAttendance["status"]): AttendanceStatus {
  if (typeof status === "number") return statusNames[status] ?? "Present";
  return statusNames.includes(status as AttendanceStatus)
    ? (status as AttendanceStatus)
    : "Present";
}

function normalizeAttendance(record: RawAttendance): Attendance {
  return {
    AttendanceId: record.AttendanceId ?? record.attendanceId ?? "",
    StudentEnrollmentId:
      record.StudentEnrollmentId ?? record.studentEnrollmentId ?? "",
    StudentId: record.StudentId ?? record.studentId ?? "",
    StudentFullName: record.StudentFullName ?? record.studentFullName,
    TeacherSectionCourseId:
      record.TeacherSectionCourseId ?? record.teacherSectionCourseId ?? "",
    SectionId: record.SectionId ?? record.sectionId ?? "",
    SectionName: record.SectionName ?? record.sectionName,
    CourseId: record.CourseId ?? record.courseId ?? "",
    CourseName: record.CourseName ?? record.courseName,
    AttendanceDate: record.AttendanceDate ?? record.attendanceDate ?? "",
    Status: normalizeStatus(record.Status ?? record.status),
    Remarks: record.Remarks ?? record.remarks,
  };
}

type RawStudentAttendanceCourse = Partial<StudentAttendanceCourse> & {
  teacherSectionCourseId?: string;
  courseId?: string;
  courseName?: string | null;
  teacherId?: string;
  sectionId?: string;
  sectionName?: string | null;
};

function normalizeStudentCourse(
  course: RawStudentAttendanceCourse,
): StudentAttendanceCourse {
  return {
    TeacherSectionCourseId:
      course.TeacherSectionCourseId ?? course.teacherSectionCourseId ?? "",
    CourseId: course.CourseId ?? course.courseId ?? "",
    CourseName: course.CourseName ?? course.courseName,
    TeacherId: course.TeacherId ?? course.teacherId ?? "",
    SectionId: course.SectionId ?? course.sectionId ?? "",
    SectionName: course.SectionName ?? course.sectionName,
  };
}

export async function getCourseAttendance(id: string, date: string) {
  const records = await apiFetch<RawAttendance[]>(
    `/api/attendance/course/${encodeURIComponent(id)}?date=${encodeURIComponent(date)}`,
  );
  return records.map(normalizeAttendance);
}

export async function listStudentAttendanceCourses(studentId: string) {
  const courses = await apiFetch<RawStudentAttendanceCourse[]>(
    `/api/attendance/student/${encodeURIComponent(studentId)}/courses`,
  );
  return courses.map(normalizeStudentCourse);
}

export async function getStudentAttendance(
  studentId: string,
  filters: { courseId?: string; from?: string; to?: string } = {},
) {
  const query = new URLSearchParams();
  if (filters.courseId) query.set("courseId", filters.courseId);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);

  const queryString = query.toString();
  const records = await apiFetch<RawAttendance[]>(
    `/api/attendance/student/${encodeURIComponent(studentId)}${queryString ? `?${queryString}` : ""}`,
  );
  return records.map(normalizeAttendance);
}

export async function markBulkAttendance(payload: BulkAttendancePayload) {
  return apiFetch<BulkAttendanceResult>("/api/attendance/bulk", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      Entries: payload.Entries.map((entry) => ({
        ...entry,
        Status: attendanceStatusValue[entry.Status],
      })),
    }),
  });
}

export async function updateAttendance(
  attendanceId: string,
  entry: BulkAttendancePayload["Entries"][number],
) {
  return apiFetch<unknown>(
    `/api/attendance/${encodeURIComponent(attendanceId)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        ...entry,
        Status: attendanceStatusValue[entry.Status],
      }),
    },
  );
}

export async function getCourseAttendanceSummary(id: string, from: string, to: string) {
  return apiFetch<AttendanceSummary[]>(`/api/attendance/course/${id}/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export async function listAttendance() {
  return apiFetch<Attendance[]>("/api/attendance");
}