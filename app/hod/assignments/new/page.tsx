"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import { listCourses } from "@/src/lib/api/courses.api";
import { listSections } from "@/src/lib/api/sections.api";
import { createTeacherSectionCourse } from "@/src/lib/api/teacher-section-course.api";
import { listTeachers } from "@/src/lib/api/teachers.api";
import type { Course, Section, Teacher } from "@/src/lib/types";

const initialState = { TeacherId: "", SectionId: "", CourseId: "", AssignedDate: new Date().toISOString().slice(0, 16), IsActive: true };
const teacherId = (teacher: Teacher) => teacher.Id ?? teacher.id ?? teacher.teacher_id ?? "";
const teacherName = (teacher: Teacher) => teacher.Fullname ?? teacher.FullName ?? teacher.fullname ?? teacher.Email ?? teacher.email ?? "Teacher";
const courseId = (course: Course) => course.Id ?? course.id ?? course.courseId ?? course.course_id ?? "";
const courseName = (course: Course) => course.Name ?? course.courseName ?? "Course";
const sectionId = (section: Section) => section.Id ?? section.id ?? section.sectionId ?? section.section_id ?? "";
const sectionName = (section: Section) => section.Name ?? section.sectionName ?? "Section";

export default function NewAssignmentPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { Promise.all([listTeachers(), listCourses(), listSections()]).then(([teacherData, courseData, sectionData]) => { setTeachers(teacherData); setCourses(courseData); setSections(sectionData); }).catch((error) => notify("error", "Data load failed", error instanceof ApiError ? error.message : "Unable to load assignment options.")); }, [notify]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.TeacherId || !form.SectionId || !form.CourseId || !form.AssignedDate) { notify("error", "Validation failed", "Select a teacher, course, section, and assigned date."); return; }
    setSubmitting(true);
    try { await createTeacherSectionCourse({ ...form, AssignedDate: `${form.AssignedDate}:00` }); notify("success", "Assignment created", "The teacher was assigned successfully."); router.push("/hod"); } catch (error) { notify("error", "Creation failed", error instanceof ApiError ? error.message : "Unable to create assignment."); } finally { setSubmitting(false); }
  };

  return <ProtectedRoute allowedRoles={["HOD"]}><AppShell><PageHeader title="Create assignment" description="Assign a teacher to a course and section." /><Card className="max-w-2xl"><form className="space-y-6" onSubmit={submit}><div className="grid gap-5 md:grid-cols-2"><Select label="Teacher" value={form.TeacherId} onChange={(event) => setForm((current) => ({ ...current, TeacherId: event.target.value }))}><option value="">Select teacher</option>{teachers.map((teacher) => <option key={teacherId(teacher)} value={teacherId(teacher)}>{teacherName(teacher)}</option>)}</Select><Select label="Course" value={form.CourseId} onChange={(event) => setForm((current) => ({ ...current, CourseId: event.target.value }))}><option value="">Select course</option>{courses.map((course) => <option key={courseId(course)} value={courseId(course)}>{courseName(course)}</option>)}</Select><Select label="Section" value={form.SectionId} onChange={(event) => setForm((current) => ({ ...current, SectionId: event.target.value }))}><option value="">Select section</option>{sections.map((section) => <option key={sectionId(section)} value={sectionId(section)}>{sectionName(section)}</option>)}</Select><label className="block text-sm text-white"><span className="mb-2 block text-[#d4d4d4]">Assigned date</span><input type="datetime-local" value={form.AssignedDate} onChange={(event) => setForm((current) => ({ ...current, AssignedDate: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2.5 text-white" /></label></div><label className="flex items-center gap-3 text-sm text-[#d4d4d4]"><input type="checkbox" checked={form.IsActive} onChange={(event) => setForm((current) => ({ ...current, IsActive: event.target.checked }))} />Active assignment</label><div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={submitting}>{submitting ? "Creating..." : "Create assignment"}</Button></div></form></Card></AppShell></ProtectedRoute>;
}