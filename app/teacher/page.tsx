"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { listTeacherSectionCourses } from "@/src/lib/api/teacher-section-course.api";
import { listTeachers } from "@/src/lib/api/teachers.api";
import { ApiError } from "@/src/lib/api/client";
import type { TeacherSectionCourse } from "@/src/lib/types";

export default function TeacherPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [assignments, setAssignments] = useState<TeacherSectionCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssignments = useCallback(async () => {
    try {
      const [data, teachers] = await Promise.all([listTeacherSectionCourses(), listTeachers()]);
      const teacherRecord = teachers.find((teacher) => (teacher.Email ?? teacher.email ?? "").toLowerCase() === (user?.Email ?? "").toLowerCase());
      const teacherEntityId = teacherRecord?.Id ?? teacherRecord?.id ?? teacherRecord?.teacher_id;
      const ownAssignments = data.filter((assignment) => {
        const assignedUserId = assignment.Teacher?.UserId ?? assignment.Teacher?.userId;
        const assignedTeacherId = assignment.TeacherId ?? assignment.teacherId ?? assignment.Teacher?.Teacher_Id;
        return assignedUserId === user?.Id || assignedTeacherId === user?.Id || assignedTeacherId === teacherEntityId;
      });
      setAssignments(ownAssignments);
    } catch (error) {
      notify("error", "Assignments unavailable", error instanceof ApiError ? error.message : "Unable to load your assignments.");
    } finally {
      setLoading(false);
    }
  }, [notify, user?.Email, user?.Id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAssignments();
  }, [loadAssignments]);

  const assignmentId = (assignment: TeacherSectionCourse) => assignment.TeacherSectionCourseId ?? assignment.teacherSectionCourseId ?? "";
  const courseName = (assignment: TeacherSectionCourse) => assignment.Course?.CourseName ?? assignment.Course?.courseName ?? "Course name unavailable";
  const sectionName = (assignment: TeacherSectionCourse) => assignment.Section?.SectionName ?? assignment.Section?.sectionName ?? "Section name unavailable";
  const courseId = (assignment: TeacherSectionCourse) => assignment.CourseId ?? assignment.courseId ?? assignment.Course?.CourseId ?? "";
  const sectionId = (assignment: TeacherSectionCourse) => assignment.SectionId ?? assignment.sectionId ?? assignment.Section?.SectionId ?? "";

  return <ProtectedRoute allowedRoles={["Teacher", "HOD"]}><AppShell><PageHeader title="Teacher Dashboard" description="Manage your assigned courses, exams, and daily attendance." /><div className="mb-6 flex flex-wrap gap-3"><Button onClick={() => router.push("/teacher/exams/new")}>Create exam</Button><Button variant="secondary" onClick={() => router.push("/teacher/attendance")}>Mark attendance</Button></div><Card><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">My assignments</h2><Badge tone="info">{loading ? "Loading" : `${assignments.length} assigned`}</Badge></div>{!loading && assignments.length === 0 ? <p className="py-8 text-sm text-[#888888]">No teacher-section-course assignments were found.</p> : <div className="grid gap-4 md:grid-cols-2">{assignments.map((assignment) => { const id = assignmentId(assignment); const course = courseId(assignment); const section = sectionId(assignment); return <div key={id || `${course}-${section}`} className="rounded-xl border border-white/10 bg-[#111111] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{courseName(assignment)}</h3><p className="mt-1 text-sm text-[#888888]">Section {sectionName(assignment)}</p></div><Badge tone={assignment.IsActive ?? assignment.isActive ? "success" : "warning"}>{assignment.IsActive ?? assignment.isActive ? "Active" : "Inactive"}</Badge></div><div className="mt-4 flex gap-3"><button type="button" className="text-[#FF6B35] underline" onClick={() => router.push(`/teacher/attendance?assignmentId=${encodeURIComponent(id)}&courseId=${encodeURIComponent(course)}&sectionId=${encodeURIComponent(section)}`)}>Attendance</button><button type="button" disabled={!id} className="text-[#d4d4d4] underline disabled:cursor-not-allowed disabled:opacity-50" onClick={() => router.push(`/teacher/exams/new?assignmentId=${encodeURIComponent(id)}&courseId=${encodeURIComponent(course)}&sectionId=${encodeURIComponent(section)}`)}>Create exam</button></div></div>; })}</div>}</Card></AppShell></ProtectedRoute>;
}
