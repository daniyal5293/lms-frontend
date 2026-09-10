import { ApiError, apiFetch } from "@/src/lib/api/client";
import type { TeacherSectionCourse } from "@/src/lib/types";

/* =========================================================
   EXAM
========================================================= */

export type CreateExamPayload = {
  Title: string;
  ExamTypeId: string;
  TotalMarks: number;
  IsPublished: boolean;
  ExamDate: string;
  TeacherSectionCourseId: string;
};

export type Exam = {
  ExamId?: string;
  examId?: string;
  examID?: string;

  Title?: string;
  title?: string;

  ExamTypeId?: string;
  examTypeId?: string;

  ExamType?: string | null;
  examType?: string | null;

  TotalMarks?: number;
  totalMarks?: number;

  IsPublished?: boolean;
  isPublished?: boolean;

  ExamDate?: string;
  examDate?: string;

  CreatedAt?: string;
  createdAt?: string;

  UpdatedAt?: string;
  updatedAt?: string;

  TeacherSectionCourseId?: string;
  teacherSectionCourseId?: string;

  TeacherSectionCourse?: TeacherSectionCourse | null;
  teacherSectionCourse?: TeacherSectionCourse | null;
};

export type TeacherExamsResponse = {
  exams: Exam[];
};

export async function createExam(payload: CreateExamPayload) {
  return apiFetch<unknown>("/api/exam", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listExamsByTeacherId(teacherId: string) {
  const response = await apiFetch<TeacherExamsResponse>(
    `/api/exam/teacher/${encodeURIComponent(teacherId)}`
  );

  return response.exams ?? [];
}

/* =========================================================
   EXAM TYPES
========================================================= */

export type ExamType = {
  examTypeId: string;
  type: string;
};

export type ExamTypesResponse = {
  types: ExamType[];
};

export async function listExamTypes() {
  const response = await apiFetch<ExamTypesResponse>("/api/examtype");

  return response.types ?? [];
}

/* =========================================================
   STUDENTS OF SECTION
========================================================= */

export type SectionStudent = {
  studentId: string;
  StudentId?: string;
  enrollmentId: string;
  EnrollmentId?: string;
  studentEnrollmentId?: string;
  StudentEnrollmentId?: string;
  fullName: string;
  FullName?: string;
};

export type SectionStudentsResponse = {
  students: SectionStudent[];
};

export async function listStudentsBySectionId(sectionId: string) {
  const response = await apiFetch<SectionStudentsResponse>(
    `/api/Student/section/${encodeURIComponent(sectionId)}`
  );

  return (response.students ?? []).map((student) => ({
    ...student,
    studentId: student.studentId ?? student.StudentId ?? "",
    enrollmentId:
      student.enrollmentId ??
      student.EnrollmentId ??
      student.studentEnrollmentId ??
      student.StudentEnrollmentId ??
      "",
    fullName: student.fullName ?? student.FullName ?? "Unnamed student",
  }));
}

/* =========================================================
   STUDENT EXAM RESULT
========================================================= */

export type CreateStudentResultPayload = {
  examId: string;
  studentId: string;
  obtainMarks: number | null; // i have decimal in my backend   public decimal? ObtainMarks { get; set; } can i use number or is there any corresponding type to decimal?
  isAbsent: boolean;
  remarks: string;
};

export type StudentResult = {
  examResultId: string;

  examId: string;

  exam?: Exam | null;

  studentId: string;

  student?: unknown | null;

  obtainMarks: number | null; // i have decimal in my backend   public decimal? ObtainMarks { get; set; } can i use number or is there any corresponding type to decimal?

  isAbsent: boolean;

  remarks: string;
  examTitle: string;          // Added to match backend ExamResultDto
  studentName: string; 
  lastUpdate?: string;
};

/**
 * Create/upload a student's result for an exam.
 *
 * Backend expects:
 * {
 *   "examId": "...",
 *   "studentId": "...",
 *   "obtainMarks": 50.5,
 *   "isAbsent": false,
 *   "remarks": ""
 * }
 */
export async function createStudentResult(
  payload: CreateStudentResultPayload
) {
  return apiFetch<{ examResultId?: string }>("/api/examresults", {
    method: "POST",
    body: JSON.stringify({
      examId: payload.examId,
      studentId: payload.studentId,
      obtainMarks: payload.obtainMarks,
      isAbsent: payload.isAbsent ?? false,
      remarks: payload.remarks ?? "",
    }),
  });
}

export async function uploadBulkStudentResults(payload: CreateStudentResultPayload[]) {
  return apiFetch<unknown>("/api/examresults/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBulkStudentResults(payload: CreateStudentResultPayload[]) {
  return apiFetch<unknown>("/api/examresult/bulk", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getStudentResultById(id: string) {
  return apiFetch<StudentResult>(`/api/examresults/${encodeURIComponent(id)}`);
}

export async function listResultsByExamId(examId: string) {
  try {
    return await apiFetch<StudentResult[]>(
      `/api/examresult/exam=${encodeURIComponent(examId)}`
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }

    throw error;
  }
}

/* =========================================================
   GET RESULTS BY STUDENT
========================================================= */

/**
 * Get all exam results for a specific student.
 *
 * Example:
 * GET /api/examresult/student=FD413C4C-C452-48EF-CA2D-08DF077C061D
 */
export async function listResultsByStudentId(studentId: string) {
  return apiFetch<StudentResult[]>(
    `/api/examresults/student/${encodeURIComponent(studentId)}`
  );
}

export async function deleteStudentResult(id: string) {
  return apiFetch<void>(`/api/examresults/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}