import { apiFetch } from "@/src/lib/api/client";
import type { TeacherSectionCourse } from "@/src/lib/types";

export type TeacherSectionCourseCreatePayload = {
  TeacherId: string;
  SectionId: string;
  CourseId: string;
  AssignedDate: string;
  IsActive: boolean;
};

export type TeacherSectionCourseUpdatePayload = TeacherSectionCourseCreatePayload & {
  RemovedDate: string | null;
};

export async function listTeacherSectionCourses() {
  const assignments = await apiFetch<TeacherSectionCourse[]>("/api/TeacherSectionCourse");
  return assignments.map((assignment) => ({
    ...assignment,
    TeacherSectionCourseId: assignment.TeacherSectionCourseId ?? assignment.teacherSectionCourseId,
    TeacherId: assignment.TeacherId ?? assignment.teacherId ?? assignment.teacher?.Teacher_Id ?? assignment.teacher?.teacher_Id,
    SectionId: assignment.SectionId ?? assignment.sectionId ?? assignment.section?.SectionId ?? assignment.section?.sectionId,
    CourseId: assignment.CourseId ?? assignment.courseId ?? assignment.course?.CourseId ?? assignment.course?.courseId,
    Teacher: assignment.Teacher ?? assignment.teacher,
    Section: assignment.Section ?? assignment.section,
    Course: assignment.Course ?? assignment.course,
    IsActive: assignment.IsActive ?? assignment.isActive,
  }));
}

export async function getTeacherSectionCourse(id: string) {
  const assignment = await apiFetch<TeacherSectionCourse>(`/api/TeacherSectionCourse/${id}`);
  return {
    ...assignment,
    TeacherSectionCourseId: assignment.TeacherSectionCourseId ?? assignment.teacherSectionCourseId,
    TeacherId: assignment.TeacherId ?? assignment.teacherId ?? assignment.teacher?.Teacher_Id ?? assignment.teacher?.teacher_Id,
    SectionId: assignment.SectionId ?? assignment.sectionId ?? assignment.section?.SectionId ?? assignment.section?.sectionId,
    CourseId: assignment.CourseId ?? assignment.courseId ?? assignment.course?.CourseId ?? assignment.course?.courseId,
    Teacher: assignment.Teacher ?? assignment.teacher,
    Section: assignment.Section ?? assignment.section,
    Course: assignment.Course ?? assignment.course,
    IsActive: assignment.IsActive ?? assignment.isActive,
  };
}

export async function createTeacherSectionCourse(payload: TeacherSectionCourseCreatePayload) {
  return apiFetch<TeacherSectionCourse>("/api/TeacherSectionCourse", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateTeacherSectionCourse(id: string, payload: TeacherSectionCourseUpdatePayload) {
  return apiFetch<TeacherSectionCourse>(`/api/TeacherSectionCourse/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteTeacherSectionCourse(id: string) {
  return apiFetch<void>(`/api/TeacherSectionCourse/${id}`, { method: "DELETE" });
}