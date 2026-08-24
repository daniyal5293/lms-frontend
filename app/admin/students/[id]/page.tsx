"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { getStudentById } from "@/src/lib/api/students.api";
import { ApiError } from "@/src/lib/api/client";
import type { Student } from "@/src/lib/types";

const value = (student: Student, pascal: keyof Student, camel: keyof Student) => String(student[pascal] ?? student[camel] ?? "Not provided");

export default function StudentDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const studentId = routeParams.id;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getStudentById(studentId).then(setStudent).catch((reason) => setError(reason instanceof ApiError ? reason.message : "Unable to load student.")).finally(() => setLoading(false));
  }, [studentId]);

  return <ProtectedRoute allowedRoles={["Admin"]}><AppShell>{loading ? <div className="py-10 text-center text-[#888888]">Loading student...</div> : error ? <div className="py-10 text-center text-red-300">{error}</div> : student ? <><PageHeader title={value(student, "FullName", "fullName")} description="Student profile and enrollment details." actions={<><Button variant="ghost" onClick={() => router.push(`/admin/students/${studentId}/edit`)}>Edit</Button><Button variant="secondary" onClick={() => router.push("/admin/students")}>Back to students</Button></>} /><Card><dl className="grid gap-4 text-sm md:grid-cols-2"><div><dt className="text-[#888888]">Email</dt><dd>{value(student, "Email", "email")}</dd></div><div><dt className="text-[#888888]">Phone</dt><dd>{value(student, "PhoneNumber", "phoneNumber")}</dd></div><div><dt className="text-[#888888]">CNIC</dt><dd>{value(student, "CNIC", "cnic")}</dd></div><div><dt className="text-[#888888]">Date of birth</dt><dd>{value(student, "DateOfBirth", "dateOfBirth")}</dd></div><div><dt className="text-[#888888]">Enrollment date</dt><dd>{value(student, "EnrollmentDate", "enrollmentDate")}</dd></div><div><dt className="text-[#888888]">Section</dt><dd><Badge tone="info">{student.Section?.Name ?? student.Section?.sectionName ?? student.SectionId ?? student.sectionId ?? "Unassigned"}</Badge></dd></div></dl></Card></> : <div className="py-10 text-center text-[#888888]">Student not found.</div>}</AppShell></ProtectedRoute>;
}