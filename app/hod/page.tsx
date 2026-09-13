"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { listTeachers } from "@/src/lib/api/teachers.api";
import { listCourses } from "@/src/lib/api/courses.api";
import { listSections } from "@/src/lib/api/sections.api";
import { deleteTeacherSectionCourse, listTeacherSectionCourses } from "@/src/lib/api/teacher-section-course.api";
import { ApiError } from "@/src/lib/api/client";
import type { Course, Section, Teacher, TeacherSectionCourse } from "@/src/lib/types";

export default function HodPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [assignments, setAssignments] = useState<TeacherSectionCourse[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssignments = useCallback(async () => {
    try {
      const [data, teacherData, courseData, sectionData] = await Promise.all([listTeacherSectionCourses(), listTeachers(), listCourses(), listSections()]);
      setAssignments(data);
      setTeachers(teacherData);
      setCourses(courseData);
      setSections(sectionData);
    } catch (error) {
      notify("error", "Assignments unavailable", error instanceof ApiError ? error.message : "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAssignments();
  }, [loadAssignments]);

  const idOf = (assignment: TeacherSectionCourse) => assignment.TeacherSectionCourseId ?? assignment.teacherSectionCourseId ?? "";
  const teacherName = (assignment: TeacherSectionCourse) => {
    const teacherId = assignment.TeacherId ?? assignment.teacherId ?? assignment.Teacher?.Teacher_Id;
    const teacher = teachers.find((item) => (item.Id ?? item.id ?? item.teacher_id) === teacherId);
    return teacher?.Fullname ?? teacher?.FullName ?? teacher?.fullname ?? teacher?.Email ?? teacher?.email ?? "Teacher";
  };
  const courseName = (assignment: TeacherSectionCourse) => {
    const courseId = assignment.CourseId ?? assignment.courseId ?? assignment.Course?.CourseId;
    return assignment.Course?.CourseName ?? assignment.Course?.courseName ?? courses.find((item) => (item.Id ?? item.id ?? item.courseId ?? item.course_id) === courseId)?.Name ?? "Course";
  };
  const sectionName = (assignment: TeacherSectionCourse) => {
    const sectionId = assignment.SectionId ?? assignment.sectionId ?? assignment.Section?.SectionId;
    return assignment.Section?.SectionName ?? assignment.Section?.sectionName ?? sections.find((item) => (item.Id ?? item.id ?? item.sectionId ?? item.section_id) === sectionId)?.Name ?? "Section";
  };

  const handleDelete = async (assignment: TeacherSectionCourse) => {
    const id = idOf(assignment);
    if (!id || !window.confirm("Delete this teacher assignment?")) return;
    try {
      await deleteTeacherSectionCourse(id);
      notify("success", "Assignment deleted", "The assignment was removed successfully.");
      void loadAssignments();
    } catch (error) {
      notify("error", "Delete failed", error instanceof ApiError ? error.message : "Unable to delete assignment.");
    }
  };

  return <ProtectedRoute allowedRoles={["HOD"]}><AppShell><PageHeader title="HOD Dashboard" description="Assign teachers to courses and sections." actions={<Button onClick={() => router.push("/hod/assignments/new")}>Create assignment</Button>} /><Card>{loading ? <div className="text-sm theme-text-muted">Loading assignments...</div> : assignments.length === 0 ? <p className="py-8 text-sm theme-text-muted">No teacher assignments found.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-black/10"><tr><th className="px-3 py-3 theme-text-muted">Teacher</th><th className="px-3 py-3 theme-text-muted">Course</th><th className="px-3 py-3 theme-text-muted">Section</th><th className="px-3 py-3 theme-text-muted">Status</th><th className="px-3 py-3 theme-text-muted">Actions</th></tr></thead><tbody>{assignments.map((assignment) => { const id = idOf(assignment); return <tr key={id} className="border-b border-black/5"><td className="px-3 py-3">{teacherName(assignment)}</td><td className="px-3 py-3">{courseName(assignment)}</td><td className="px-3 py-3">{sectionName(assignment)}</td><td className="px-3 py-3"><Badge tone={assignment.IsActive ?? assignment.isActive ? "success" : "warning"}>{assignment.IsActive ?? assignment.isActive ? "Active" : "Inactive"}</Badge></td><td className="px-3 py-3"><div className="flex gap-3"><button type="button" className="theme-text-primary underline" onClick={() => router.push(`/hod/assignments/${id}/edit`)}>Edit</button><button type="button" className="text-red-300 underline" onClick={() => handleDelete(assignment)}>Delete</button></div></td></tr>; })}</tbody></table></div>}</Card></AppShell></ProtectedRoute>;
}






