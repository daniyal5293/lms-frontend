"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import { listSections } from "@/src/lib/api/sections.api";
import { getStudentById, updateStudent, type CreateStudentPayload } from "@/src/lib/api/students.api";
import type { Section, Student } from "@/src/lib/types";

type FormState = CreateStudentPayload;
const initialState: FormState = { fullName: "", email: "", phoneNumber: "", dateOfBirth: "", enrollmentDate: "", cnic: "", sectionId: "" };
const read = (student: Student, pascal: keyof Student, camel: keyof Student) => String(student[pascal] ?? student[camel] ?? "");

export default function EditStudentPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const studentId = routeParams.id;
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getStudentById(studentId), listSections()]).then(([student, sectionData]) => { setSections(sectionData); setForm({ fullName: read(student, "FullName", "fullName"), email: read(student, "Email", "email"), phoneNumber: read(student, "PhoneNumber", "phoneNumber"), dateOfBirth: read(student, "DateOfBirth", "dateOfBirth").slice(0, 10), enrollmentDate: read(student, "EnrollmentDate", "enrollmentDate").slice(0, 10), cnic: read(student, "CNIC", "cnic"), sectionId: read(student, "SectionId", "sectionId") }); }).catch((error) => notify("error", "Student load failed", error instanceof ApiError ? error.message : "Unable to load student.")).finally(() => setLoading(false));
  }, [notify, studentId]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(form).some((item) => !item.trim())) { notify("error", "Validation failed", "Complete all student fields."); return; }
    setSubmitting(true);
    try { await updateStudent(studentId, form); notify("success", "Student updated", "The student record was updated successfully."); router.push(`/admin/students/${studentId}`); } catch (error) { notify("error", "Update failed", error instanceof ApiError ? error.message : "Unable to update student."); } finally { setSubmitting(false); }
  };

  if (loading) return <AppShell><div className="py-10 text-center theme-text-muted">Loading student...</div></AppShell>;
  return <ProtectedRoute allowedRoles={["Admin"]}><AppShell><PageHeader title="Edit Student" description="Update student contact and enrollment details." /><Card><form className="space-y-6" onSubmit={submit} noValidate><div className="grid gap-5 md:grid-cols-2"><Input label="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} /><Input label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /><Input label="Phone number" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} /><Input label="CNIC" value={form.cnic} onChange={(event) => setForm((current) => ({ ...current, cnic: event.target.value }))} /><Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))} /><Input label="Enrollment date" type="date" value={form.enrollmentDate} onChange={(event) => setForm((current) => ({ ...current, enrollmentDate: event.target.value }))} /><Select label="Section" value={form.sectionId} onChange={(event) => setForm((current) => ({ ...current, sectionId: event.target.value }))}><option value="">Select a section</option>{sections.map((section) => { const id = section.Id ?? section.id ?? section.sectionId ?? ""; return <option key={id} value={id}>{section.Name ?? section.sectionName ?? id}</option>; })}</Select></div><div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button></div></form></Card></AppShell></ProtectedRoute>;
}
