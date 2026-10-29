"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { getStudentById, setStudentStatus } from "@/src/lib/api/students.api";
import { ApiError } from "@/src/lib/api/client";
import type { Student } from "@/src/lib/types";
import { formatDate, formatDateTime, studentSectionLabel } from "@/src/lib/utils";

const value = (student: Student, pascal: keyof Student, camel: keyof Student) => String(student[pascal] ?? student[camel] ?? "") || "Not provided";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide theme-text-muted">{label}</dt>
      <dd className="mt-1 theme-text">{children}</dd>
    </div>
  );
}

export default function StudentDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const studentId = routeParams.id;
  const { notify } = useNotifications();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getStudentById(studentId).then(setStudent).catch((reason) => setError(reason instanceof ApiError ? reason.message : "Unable to load student.")).finally(() => setLoading(false));
  }, [studentId]);

  const active = student ? (student.IsActive ?? student.isActive ?? true) : true;

  const toggleStatus = async () => {
    if (!student) return;
    if (active && !window.confirm("Deactivate this student? They will be signed out and unable to log in until reactivated.")) return;
    setUpdating(true);
    try {
      const updated = await setStudentStatus(studentId, !active);
      setStudent((current) => (current ? { ...current, ...updated } : updated));
      notify("success", active ? "Student deactivated" : "Student activated", value(student, "FullName", "fullName"));
    } catch (reason) {
      notify("error", "Status change failed", reason instanceof ApiError ? reason.message : "Unable to change status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        {loading ? (
          <div className="py-10 text-center theme-text-muted">Loading student...</div>
        ) : error ? (
          <div className="py-10 text-center text-red-600">{error}</div>
        ) : student ? (
          <>
            <PageHeader
              title={value(student, "FullName", "fullName")}
              description={`Student code ${value(student, "StudentCode", "studentCode")}`}
              actions={
                <>
                  <Button variant={active ? "danger" : "primary"} loading={updating} onClick={() => void toggleStatus()}>{active ? "Deactivate" : "Activate"}</Button>
                  <Button variant="ghost" onClick={() => router.push(`/admin/students/${studentId}/edit`)}>Edit</Button>
                  <Button variant="secondary" onClick={() => router.push("/admin/students")}>Back to students</Button>
                </>
              }
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold theme-text">Institute info</h2>
                  <Badge tone={active ? "success" : "danger"}>{active ? "Active" : "Inactive"}</Badge>
                </div>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <Field label="Student code"><span className="font-mono">{value(student, "StudentCode", "studentCode")}</span></Field>
                  <Field label="Cohort">{value(student, "Cohort", "cohort")}</Field>
                  <Field label="Campus">{value(student, "Campus", "campus")}</Field>
                  <Field label="Major subject">{value(student, "MajorSubject", "majorSubject")}</Field>
                  <Field label="Section"><Badge tone="info">{studentSectionLabel(student)}</Badge></Field>
                  <Field label="Department">{student.Department || "Unassigned"}</Field>
                  <Field label="Enrollment date">{formatDateTime(student.EnrollmentDate ?? student.enrollmentDate)}</Field>
                </dl>
              </Card>
              <Card>
                <h2 className="mb-4 text-lg font-semibold theme-text">Personal info</h2>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <Field label="Father's name">{value(student, "FatherName", "fatherName")}</Field>
                  <Field label="Gender">{value(student, "Gender", "gender")}</Field>
                  <Field label="Date of birth">{formatDate(student.DateOfBirth ?? student.dateOfBirth)}</Field>
                  <Field label="CNIC / B-Form">{value(student, "CNIC", "cnic")}</Field>
                  <Field label="Email">{value(student, "Email", "email")}</Field>
                  <Field label="Phone">{value(student, "PhoneNumber", "phoneNumber")}</Field>
                </dl>
              </Card>
            </div>
          </>
        ) : (
          <div className="py-10 text-center theme-text-muted">Student not found.</div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
