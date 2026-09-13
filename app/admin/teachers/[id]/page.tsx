"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/src/components/layout/AppShell";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { getTeacherById } from "@/src/lib/api/teachers.api";
import { formatCurrency, formatDate } from "@/src/lib/utils";
import type { Teacher } from "@/src/lib/types";

export default function TeacherDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const teacherId = routeParams.id;
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTeacherById(teacherId);
        setTeacher(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [teacherId]);

  if (loading) return <AppShell><div className="py-10 text-center theme-text-muted">Loading teacher details...</div></AppShell>;
  if (!teacher) return <AppShell><div className="py-10 text-center theme-text-muted">Teacher not found.</div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title={teacher.Fullname ?? teacher.FullName ?? teacher.fullname ?? "Teacher"}
        description="Detailed employment and personal information."
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push(`/admin/teachers/${teacherId}/edit`)}>Edit</Button>
            <Button variant="secondary" onClick={() => router.push("/admin/teachers")}>Back to list</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Profile</h2>
            <Badge tone={teacher.Active ?? teacher.IsActive ? "success" : "warning"}>
              {teacher.Active ?? teacher.IsActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">Full name</dt><dd className="text-white">{teacher.Fullname ?? teacher.FullName ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">Email</dt><dd className="text-white">{teacher.Email ?? teacher.email ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">Department</dt><dd className="text-white">{teacher.Department ?? teacher.department ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">Salary</dt><dd className="text-white">{formatCurrency(teacher.Salary ?? teacher.salary)}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">CNIC</dt><dd className="text-white">{teacher.CNIC ?? teacher.cnic ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">Date of birth</dt><dd className="text-white">{formatDate(teacher.DateOfBirth ?? teacher.dateOfBirth)}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">Hire date</dt><dd className="text-white">{formatDate(teacher.HireDate ?? teacher.hireDate)}</dd></div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">Professional details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">Identification</dt><dd className="text-white">{teacher.IdentificationNumber ?? teacher.identificationNumber ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">Qualification</dt><dd className="text-white">{teacher.Qualification ?? teacher.qualification ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">Address</dt><dd className="text-white">{teacher.Address ?? teacher.address ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="theme-text-muted">Role</dt><dd className="text-white">{teacher.Role ?? "Teacher"}</dd></div>
          </dl>
        </Card>
      </div>
    </AppShell>
  );
}

