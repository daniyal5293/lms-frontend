"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { listCourses, deleteCourse } from "@/src/lib/api/courses.api";
import { ApiError } from "@/src/lib/api/client";
import type { Course } from "@/src/lib/types";

export default function AdminCoursesPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCourses();
      setCourses(data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to load courses.";
      notify("error", "Course list failed", message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCourses();
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return courses;
    return courses.filter((course) => {
      const text = `${course.Name} ${course.Code} ${course.Description ?? ""}`.toLowerCase();
      return text.includes(value);
    });
  }, [courses, query]);

  const handleDelete = async (course: Course) => {
    if (!course.Id && !course.id) return;
    const id = course.Id ?? course.id ?? "";
    const confirmed = window.confirm(`Delete ${course.Name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteCourse(id);
      notify("success", "Course deleted", "The course was removed successfully.");
      loadCourses();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to delete course.";
      notify("error", "Deletion failed", message);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader
        title="Courses"
        description="Manage academic offerings and curriculum details."
        actions={<Button variant="primary" onClick={() => router.push("/admin/courses/new")}>Create Course</Button>}
      />

      <Card className="mb-6">
        <div className="max-w-md">
          <Input
            label="Search"
            placeholder="Search by code, name, or description"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </Card>

      <Card>
        {loading ? <div className="text-sm text-[#888888]">Loading courses...</div> : filteredCourses.length === 0 ? (
          <div className="py-8 text-center">
            <h3 className="text-lg font-semibold text-white">No courses found</h3>
            <p className="mt-2 text-sm text-[#888888]">There are currently no courses available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-3 py-3 font-medium text-[#888888]">Code</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Course</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Credits</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Description</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.Id ?? course.id ?? course.Code} className="border-b border-white/5 align-top">
                    <td className="px-3 py-3 font-medium text-white">{course.Code}</td>
                    <td className="px-3 py-3 text-[#d4d4d4]">{course.Name}</td>
                    <td className="px-3 py-3 text-[#d4d4d4]">{course.Credits}</td>
                    <td className="px-3 py-3 text-[#d4d4d4] max-w-md">{course.Description ?? "No description provided."}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => router.push(`/admin/courses/${course.Id ?? course.id}`)} className="text-[#FF6B35] underline underline-offset-4">View</button>
                        <button type="button" onClick={() => router.push(`/admin/courses/${course.Id ?? course.id}/edit`)} className="text-[#d4d4d4] underline underline-offset-4">Edit</button>
                        <button type="button" onClick={() => handleDelete(course)} className="text-red-300 underline underline-offset-4">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
