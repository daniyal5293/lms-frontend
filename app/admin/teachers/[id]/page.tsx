"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/src/components/layout/AppShell";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { getTeacherById } from "@/src/lib/api/teachers.api";
import { formatCurrency, formatDate } from "@/src/lib/utils";
import type { Teacher } from "@/src/lib/types";

export default function TeacherDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTeacherById(params.id);
        setTeacher(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id]);

  if (loading) return <AppShell><div className="py-10 text-center text-[#888888]">Loading teacher details...</div></AppShell>;
  if (!teacher) return <AppShell><div className="py-10 text-center text-[#888888]">Teacher not found.</div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title={teacher.Fullname ?? teacher.FullName ?? "Teacher"}
        description="Detailed employment and personal information."
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push(`/admin/teachers/${params.id}/edit`)}>Edit</Button>
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
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">Full name</dt><dd className="text-white">{teacher.Fullname ?? teacher.FullName ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">Email</dt><dd className="text-white">{teacher.Email ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">Department</dt><dd className="text-white">{teacher.Department ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">Salary</dt><dd className="text-white">{formatCurrency(teacher.Salary)}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">CNIC</dt><dd className="text-white">{teacher.CNIC ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">Date of birth</dt><dd className="text-white">{formatDate(teacher.DateOfBirth)}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">Hire date</dt><dd className="text-white">{formatDate(teacher.HireDate)}</dd></div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">Professional details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">Identification</dt><dd className="text-white">{teacher.IdentificationNumber ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">Qualification</dt><dd className="text-white">{teacher.Qualification ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">Address</dt><dd className="text-white">{teacher.Address ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-[#888888]">Role</dt><dd className="text-white">{teacher.Role ?? "Teacher"}</dd></div>
          </dl>
        </Card>
      </div>
    </AppShell>
  );
}
