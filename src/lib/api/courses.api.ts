import { apiFetch } from "@/src/lib/api/client";
import type { Course } from "@/src/lib/types";

export async function listCourses() {
  return apiFetch<Course[]>("/api/courses");
}

export async function getCourseById(id: string) {
  return apiFetch<Course>(`/api/courses/${id}`);
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
