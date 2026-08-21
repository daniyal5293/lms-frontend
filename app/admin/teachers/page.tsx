"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { listTeachers, deleteTeacher, restoreTeacher, promoteTeacher, demoteTeacher } from "@/src/lib/api/teachers.api";
import { ApiError } from "@/src/lib/api/client";
import type { Teacher } from "@/src/lib/types";
import { formatDate } from "@/src/lib/utils";

export default function AdminTeachersPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTeachers();
      setTeachers(data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to load teachers.";
      notify("error", "Teacher list failed", message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTeachers();
  }, [loadTeachers]);

  const filteredTeachers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return teachers;

    return teachers.filter((teacher) => {
      const fullName = `${teacher.Fullname ?? teacher.FullName ?? ""}`.toLowerCase();
      const email = (teacher.Email ?? "").toLowerCase();
      const department = (teacher.Department ?? "").toLowerCase();
      return fullName.includes(value) || email.includes(value) || department.includes(value);
    });
  }, [query, teachers]);

  const handleDelete = async (teacher: Teacher) => {
    if (!teacher.Id) return;
    const confirmed = window.confirm(
      `This will remove ${teacher.Fullname ?? teacher.FullName ?? "this teacher"}. The action may be a soft delete. Continue?`,
    );
    if (!confirmed) return;

    try {
      await deleteTeacher(teacher.Id);
      notify("success", "Teacher deleted", "The teacher record was removed successfully.");
      loadTeachers();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to delete teacher.";
      notify("error", "Deletion failed", message);
    }
  };

  const handleRestore = async (teacher: Teacher) => {
    if (!teacher.Id) return;
    try {
      await restoreTeacher(teacher.Id);
      notify("success", "Teacher restored", "The teacher has been restored.");
      loadTeachers();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to restore teacher.";
      notify("error", "Restore failed", message);
    }
  };

  const handlePromote = async (teacher: Teacher) => {
    if (!teacher.Id) return;
    const confirmed = window.confirm(`Promote ${teacher.Fullname ?? teacher.FullName ?? "this teacher"} to HOD?`);
    if (!confirmed) return;

    try {
      await promoteTeacher(teacher.Id);
      notify("success", "Teacher promoted", "Teacher was promoted to HOD.");
      loadTeachers();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to promote teacher.";
      notify("error", "Promotion failed", message);
    }
  };

  const handleDemote = async (teacher: Teacher) => {
    if (!teacher.Id) return;
    const confirmed = window.confirm(`Demote ${teacher.Fullname ?? teacher.FullName ?? "this teacher"} from HOD back to Teacher?`);
    if (!confirmed) return;

    try {
      await demoteTeacher(teacher.Id);
      notify("success", "Teacher demoted", "The teacher role was updated.");
      loadTeachers();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to demote teacher.";
      notify("error", "Demotion failed", message);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader
        title="Teachers"
        description="Manage academic staff and their employment records."
        actions={
          <Button variant="primary" onClick={() => router.push("/admin/teachers/new")}>Add Teacher</Button>
        }
      />

      <Card className="mb-6">
        <div className="max-w-md">
          <Input
            label="Search"
            placeholder="Search by name, email, or department"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-sm text-[#888888]">Loading teachers...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-8 text-center">
            <h3 className="text-lg font-semibold text-white">No teachers found</h3>
            <p className="mt-2 text-sm text-[#888888]">No teacher records match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-3 py-3 font-medium text-[#888888]">Name</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Email</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Department</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Status</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Hire</th>
                  <th className="px-3 py-3 font-medium text-[#888888]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.Id ?? `${teacher.Email}-${teacher.Fullname ?? teacher.FullName}`} className="border-b border-white/5">
                    <td className="px-3 py-3">
                      <div className="font-medium">{teacher.Fullname ?? teacher.FullName ?? "Unknown"}</div>
                    </td>
                    <td className="px-3 py-3 text-[#d4d4d4]">{teacher.Email ?? "Not provided"}</td>
                    <td className="px-3 py-3 text-[#d4d4d4]">{teacher.Department ?? "Not provided"}</td>
                    <td className="px-3 py-3">
                      <Badge tone={teacher.Active ?? teacher.IsActive ? "success" : "warning"}>
                        {teacher.Active ?? teacher.IsActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-[#d4d4d4]">{formatDate(teacher.HireDate ?? undefined)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => router.push(`/admin/teachers/${teacher.Id}`)} className="text-[#FF6B35] underline underline-offset-4">
                          View
                        </button>
                        <button type="button" onClick={() => router.push(`/admin/teachers/${teacher.Id}/edit`)} className="text-[#d4d4d4] underline underline-offset-4">
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(teacher)} className="text-red-300 underline underline-offset-4">
                          Delete
                        </button>
                        {(teacher.Active ?? teacher.IsActive) ? (
                          <button type="button" onClick={() => handlePromote(teacher)} className="text-[#7dd3fc] underline underline-offset-4">
                            Promote
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleRestore(teacher)} className="text-emerald-300 underline underline-offset-4">
                            Restore
                          </button>
                        )}
                        {((teacher.Role ?? "Teacher") === "HOD") || (teacher.FullName?.includes("HOD") ?? false) ? (
                          <button type="button" onClick={() => handleDemote(teacher)} className="text-amber-300 underline underline-offset-4">
                            Demote
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
