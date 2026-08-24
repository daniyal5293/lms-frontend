"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import { listTeacherSectionCourses } from "@/src/lib/api/teacher-section-course.api";
import { listTeachers } from "@/src/lib/api/teachers.api";
import { createExam } from "@/src/lib/api/exams.api";
import type { TeacherSectionCourse } from "@/src/lib/types";

const initialState = { Title: "", ExamType: "", TotalMarks: "", IsPublished: false, ExamDate: "", TeacherSectionCourseId: "" };

export default function NewExamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [assignments, setAssignments] = useState<TeacherSectionCourse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([listTeacherSectionCourses(), listTeachers()]).then(([data, teachers]) => {
      const teacherRecord = teachers.find((teacher) => (teacher.Email ?? teacher.email ?? "").toLowerCase() === (user?.Email ?? "").toLowerCase());
      const teacherEntityId = teacherRecord?.Id ?? teacherRecord?.id ?? teacherRecord?.teacher_id;
      const ownAssignments = data.filter((assignment) => {
        const assignedUserId = assignment.Teacher?.UserId ?? assignment.Teacher?.userId;
        const assignedTeacherId = assignment.TeacherId ?? assignment.teacherId ?? assignment.Teacher?.Teacher_Id;
        return assignedUserId === user?.Id || assignedTeacherId === user?.Id || assignedTeacherId === teacherEntityId;
      });
      const assignmentId = new URLSearchParams(window.location.search).get("assignmentId");
      const query = new URLSearchParams(window.location.search);
      const queryCourseId = query.get("courseId");
      const querySectionId = query.get("sectionId");
      const selectedAssignment = ownAssignments.find((assignment) => {
        const currentAssignmentId = assignment.TeacherSectionCourseId ?? assignment.teacherSectionCourseId;
        const currentCourseId = assignment.CourseId ?? assignment.courseId ?? assignment.Course?.CourseId;
        const currentSectionId = assignment.SectionId ?? assignment.sectionId ?? assignment.Section?.SectionId;
        return (assignmentId && currentAssignmentId === assignmentId) || (queryCourseId && querySectionId && currentCourseId === queryCourseId && currentSectionId === querySectionId);
      });
      setAssignments(ownAssignments);
      setForm((current) => ({ ...current, TeacherSectionCourseId: selectedAssignment?.TeacherSectionCourseId ?? selectedAssignment?.teacherSectionCourseId ?? ownAssignments[0]?.TeacherSectionCourseId ?? ownAssignments[0]?.teacherSectionCourseId ?? "" }));
    }).catch((error) => notify("error", "Assignments unavailable", error instanceof ApiError ? error.message : "Unable to load assignments."));
  }, [notify, user?.Email, user?.Id]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.Title.trim() || !form.ExamType.trim() || !form.TotalMarks || !form.ExamDate || !form.TeacherSectionCourseId) { notify("error", "Validation failed", "Complete all exam fields."); return; }
    setSubmitting(true);
    try { await createExam({ ...form, Title: form.Title.trim(), ExamType: form.ExamType.trim(), TotalMarks: Number(form.TotalMarks), ExamDate: form.ExamDate }); notify("success", "Exam created", "The exam was created successfully."); router.push("/teacher"); } catch (error) { notify("error", "Exam creation failed", error instanceof ApiError ? error.message : "Unable to create exam."); } finally { setSubmitting(false); }
  };

  const selectedAssignment = assignments.find((assignment) => (assignment.TeacherSectionCourseId ?? assignment.teacherSectionCourseId) === form.TeacherSectionCourseId);
  const assignmentFromCard = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("assignmentId");
  const assignmentLabel = selectedAssignment ? `${selectedAssignment.Course?.CourseName ?? selectedAssignment.Course?.courseName ?? "Course"} - ${selectedAssignment.Section?.SectionName ?? selectedAssignment.Section?.sectionName ?? "Section"}` : "No assigned course selected";

  return <ProtectedRoute allowedRoles={["Teacher", "HOD"]}><AppShell><PageHeader title="Create exam" description="Publish an exam for one of your assigned courses." /><Card className="max-w-2xl"><form className="space-y-6" onSubmit={submit} noValidate><div className="grid gap-5 md:grid-cols-2"><Input label="Title" value={form.Title} onChange={(event) => setForm((current) => ({ ...current, Title: event.target.value }))} /><Input label="Exam type" placeholder="Midterm" value={form.ExamType} onChange={(event) => setForm((current) => ({ ...current, ExamType: event.target.value }))} /><Input label="Total marks" type="number" min="1" value={form.TotalMarks} onChange={(event) => setForm((current) => ({ ...current, TotalMarks: event.target.value }))} /><Input label="Exam date" type="date" value={form.ExamDate} onChange={(event) => setForm((current) => ({ ...current, ExamDate: event.target.value }))} />{assignmentFromCard ? <div className="rounded-xl border border-white/10 bg-[#111111] px-3 py-2.5 text-sm text-white"><span className="mb-1 block text-[#888888]">Assigned course and section</span>{assignmentLabel}</div> : <Select label="Assigned course and section" value={form.TeacherSectionCourseId} onChange={(event) => setForm((current) => ({ ...current, TeacherSectionCourseId: event.target.value }))}><option value="">Select assignment</option>{assignments.map((assignment) => { const id = assignment.TeacherSectionCourseId ?? assignment.teacherSectionCourseId ?? ""; return <option key={id} value={id}>{assignment.Course?.CourseName ?? assignment.Course?.courseName ?? "Course"} - {assignment.Section?.SectionName ?? assignment.Section?.sectionName ?? "Section"}</option>; })}</Select>}<label className="flex items-center gap-3 text-sm text-[#d4d4d4]"><input type="checkbox" checked={form.IsPublished} onChange={(event) => setForm((current) => ({ ...current, IsPublished: event.target.checked }))} />Publish immediately</label></div><div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={submitting}>{submitting ? "Creating..." : "Create exam"}</Button></div></form></Card></AppShell></ProtectedRoute>;
}