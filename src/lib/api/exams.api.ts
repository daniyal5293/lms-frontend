import { apiFetch } from "@/src/lib/api/client";
import type { TeacherSectionCourse } from "@/src/lib/types";

export type CreateExamPayload = {
  Title: string;
  ExamTypeId: string;
  TotalMarks: number;
  IsPublished: boolean;
  ExamDate: string;
  TeacherSectionCourseId: string;
};

export async function createExam(payload: CreateExamPayload) {
  return apiFetch<unknown>("/api/exam", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type Exam = {
  ExamId?: string;
  examId?: string;
  Title?: string;
  title?: string;
  ExamType?: string;
  examType?: string;
  ExamTypeId?: string;
  examTypeId?: string;
  TotalMarks?: number;
  totalMarks?: number;
  IsPublished?: boolean;
  isPublished?: boolean;
  ExamDate?: string;
  examDate?: string;
  TeacherSectionCourseId?: string;
  teacherSectionCourseId?: string;
  TeacherSectionCourse?: TeacherSectionCourse | null;
};

export type ExamType = {
  examTypeId: string;
  type: string;
};

export type ExamTypesResponse = {
  types: ExamType[];
};

export async function listExams() {
  return apiFetch<Exam[]>("/api/exam");
}

export async function listExamTypes() {
  const response = await apiFetch<ExamTypesResponse>("/api/examtype");

  return response.types ?? [];
}