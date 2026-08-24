import { apiFetch } from "@/src/lib/api/client";

export type CreateExamPayload = {
  Title: string;
  ExamType: string;
  TotalMarks: number;
  IsPublished: boolean;
  ExamDate: string;
  TeacherSectionCourseId: string;
};

export async function createExam(payload: CreateExamPayload) {
  return apiFetch<unknown>("/api/exam", { method: "POST", body: JSON.stringify(payload) });
}