"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { getTeacherSectionCourse, updateTeacherSectionCourse, type TeacherSectionCourseUpdatePayload } from "@/src/lib/api/teacher-section-course.api";
import { listTeachers } from "@/src/lib/api/teachers.api";
import type { Course, Section, Teacher } from "@/src/lib/types";

const initialState: TeacherSectionCourseUpdatePayload = { TeacherId: "", SectionId: "", CourseId: "", AssignedDate: "", RemovedDate: null, IsActive: true };
const teacherId = (teacher: Teacher) => teacher.Id ?? teacher.id ?? teacher.teacher_id ?? "";
const courseId = (course: Course) => course.Id ?? course.id ?? course.courseId ?? course.course_id ?? "";
const sectionId = (section: Section) => section.Id ?? section.id ?? section.sectionId ?? section.section_id ?? "";

export default function EditAssignmentPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const assignmentId = routeParams.id;
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getTeacherSectionCourse(assignmentId), listTeachers(), listCourses(), listSections()]).then(([assignment, teacherData, courseData, sectionData]) => {
      setTeachers(teacherData); setCourses(courseData); setSections(sectionData);
      setForm({ TeacherId: assignment.TeacherId ?? assignment.teacherId ?? "", SectionId: assignment.SectionId ?? assignment.sectionId ?? "", CourseId: assignment.CourseId ?? assignment.courseId ?? "", AssignedDate: (assignment.AssignedDate ?? assignment.assignedDate ?? "").slice(0, 16), RemovedDate: assignment.RemovedDate ?? assignment.removedDate ?? null, IsActive: assignment.IsActive ?? assignment.isActive ?? true });
    }).catch((error) => notify("error", "Assignment load failed", error instanceof ApiError ? error.message : "Unable to load assignment.")).finally(() => setLoading(false));
  }, [assignmentId, notify]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.TeacherId || !form.SectionId || !form.CourseId || !form.AssignedDate) { notify("error", "Validation failed", "Complete all assignment fields."); return; }
    setSubmitting(true);
    try { await updateTeacherSectionCourse(assignmentId, { ...form, AssignedDate: `${form.AssignedDate}:00` }); notify("success", "Assignment updated", "The assignment was updated successfully."); router.push("/hod"); } catch (error) { notify("error", "Update failed", error instanceof ApiError ? error.message : "Unable to update assignment."); } finally { setSubmitting(false); }
  };

  return <ProtectedRoute allowedRoles={["HOD"]}><AppShell>{loading ? <div className="py-10 text-center theme-text-muted">Loading assignment...</div> : <><PageHeader title="Edit assignment" description="Update the teacher, course, section, or assignment status." /><Card className="max-w-2xl"><form className="space-y-6" onSubmit={submit}><div className="grid gap-5 md:grid-cols-2"><Select label="Teacher" value={form.TeacherId} onChange={(event) => setForm((current) => ({ ...current, TeacherId: event.target.value }))}><option value="">Select teacher</option>{teachers.map((teacher) => <option key={teacherId(teacher)} value={teacherId(teacher)}>{teacher.Fullname ?? teacher.FullName ?? teacher.fullname ?? teacher.Email ?? teacher.email}</option>)}</Select><Select label="Course" value={form.CourseId} onChange={(event) => setForm((current) => ({ ...current, CourseId: event.target.value }))}><option value="">Select course</option>{courses.map((course) => <option key={courseId(course)} value={courseId(course)}>{course.Name ?? course.courseName}</option>)}</Select><Select label="Section" value={form.SectionId} onChange={(event) => setForm((current) => ({ ...current, SectionId: event.target.value }))}><option value="">Select section</option>{sections.map((section) => <option key={sectionId(section)} value={sectionId(section)}>{section.Name ?? section.sectionName}</option>)}</Select><label className="block text-sm text-white"><span className="mb-2 block theme-text-soft">Assigned date</span><input type="datetime-local" value={form.AssignedDate} onChange={(event) => setForm((current) => ({ ...current, AssignedDate: event.target.value }))} className="w-full rounded-xl border border-white/10 theme-bg-input px-3 py-2.5 text-white" /></label></div><label className="flex items-center gap-3 text-sm theme-text-soft"><input type="checkbox" checked={form.IsActive} onChange={(event) => setForm((current) => ({ ...current, IsActive: event.target.checked }))} />Active assignment</label><div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={submitting}>{submitting ? "Saving..." : "Save changes"}</Button></div></form></Card></>}</AppShell></ProtectedRoute>;
}
