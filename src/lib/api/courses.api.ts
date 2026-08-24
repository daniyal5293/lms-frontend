import { apiFetch } from "@/src/lib/api/client";
import type { Course } from "@/src/lib/types";

type RawCourse = Course & {
  courseId?: string;
  courseName?: string;
  courseDescription?: string | null;
  courseDuration?: number;
};

function normalizeCourse(course: RawCourse): Course {
  return {
    ...course,
    Id: course.Id ?? course.id ?? course.courseId ?? course.course_id,
    Name: course.Name ?? course.courseName ?? "Unnamed course",
    Description: course.Description ?? course.courseDescription,
    Credits: course.Credits ?? course.courseDuration ?? 0,
  };
}

export async function listCourses() {
  const courses = await apiFetch<RawCourse[]>("/api/courses");
  return courses.map(normalizeCourse);
}

export async function getCourseById(id: string) {
  const course = await apiFetch<RawCourse>(`/api/courses/${id}`);
  return normalizeCourse(course);
}

export async function createCourse(payload: Record<string, unknown>) {
  return apiFetch<Course>("/api/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCourse(id: string, payload: Record<string, unknown>) {
  return apiFetch<Course>(`/api/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteCourse(id: string) {
  return apiFetch<void>(`/api/courses/${id}`, { method: "DELETE" });
}
