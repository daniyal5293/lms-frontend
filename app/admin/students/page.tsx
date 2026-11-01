"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { ApiError } from "@/src/lib/api/client";
import { deleteStudent, exportStudents, listStudents, setStudentStatus } from "@/src/lib/api/students.api";
import type { Student } from "@/src/lib/types";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Select } from "@/src/components/ui/Select";
import { studentSectionLabel } from "@/src/lib/utils";

const studentId = (student: Student) => student.Id ?? student.id ?? student.StudentId ?? student.studentId ?? student.student_id ?? "";
const studentName = (student: Student) => student.FullName ?? student.fullName ?? "Unnamed student";
const isActive = (student: Student) => student.IsActive ?? student.isActive ?? true;

export default function StudentsPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      setStudents(await listStudents());
    } catch (error) {
      notify("error", "Student list failed", error instanceof ApiError ? error.message : "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const value = query.trim().toLowerCase();
    return students.filter((student) => {
      if (statusFilter === "active" && !isActive(student)) return false;
      if (statusFilter === "inactive" && isActive(student)) return false;
      if (!value) return true;
      return `${student.StudentCode ?? ""} ${studentName(student)} ${student.Email ?? student.email ?? ""} ${student.CNIC ?? student.cnic ?? ""} ${studentSectionLabel(student)} ${student.Cohort ?? ""} ${student.Campus ?? ""} ${student.Department ?? ""}`
        .toLowerCase()
        .includes(value);
    });
  }, [query, statusFilter, students]);

  const handleDelete = async (student: Student) => {
    const id = studentId(student);
    if (!id || !window.confirm(`Delete ${studentName(student)}? This action cannot be undone.`)) return;
    try {
      const result = await deleteStudent(id);
      notify("success", result?.deactivated ? "Student deactivated" : "Student deleted", result?.message ?? "The student was removed successfully.");
      void loadStudents();
    } catch (error) {
      notify("error", "Deletion failed", error instanceof ApiError ? error.message : "Unable to delete student.");
    }
  };

  const handleToggleStatus = async (student: Student) => {
    const id = studentId(student);
    const activate = !isActive(student);
    if (!activate && !window.confirm(`Deactivate ${studentName(student)}? They will be signed out and unable to log in until reactivated.`)) return;
    try {
      const updated = await setStudentStatus(id, activate);
      setStudents((current) => current.map((item) => (studentId(item) === id ? { ...item, ...updated } : item)));
      notify("success", activate ? "Student activated" : "Student deactivated", studentName(student));
    } catch (error) {
      notify("error", "Status change failed", error instanceof ApiError ? error.message : "Unable to change status.");
    }
  };

  const handleExport = async () => {
    try {
      const file = await exportStudents();
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = decodeURIComponent(file.filename);
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      notify("error", "Export failed", error instanceof ApiError ? error.message : "Unable to export students.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader
          title="Students"
          description="Manage student accounts, cohorts, campuses and enrollment."
          actions={<div className="flex gap-2"><Button variant="secondary" onClick={handleExport}>Export Excel</Button><Button onClick={() => router.push("/admin/students/new")}>Add Student</Button></div>}
        />
        <Card className="mb-3">
          <div className="grid gap-2.5 md:grid-cols-[minmax(0,28rem)_12rem]">
            <Input label="Search" placeholder="Search by code, name, email, section, cohort..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">All students</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </Card>
        <Card>
          {loading ? (
            <div className="text-sm theme-text-muted">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-8 text-center"><h3 className="text-lg font-semibold theme-text">No students found</h3><p className="mt-2 text-sm theme-text-muted">No student records match your search.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm theme-text">
                <thead className="border-b border-black/10">
                  <tr>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">Code</th>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">Student</th>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">Phone</th>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">Cohort</th>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">Section</th>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">Status</th>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const id = studentId(student);
                    const active = isActive(student);
                    return (
                      <tr key={id || `${student.Email ?? student.email}-${studentName(student)}`} className="border-b border-black/5">
                        <td className="px-2.5 py-1.5 font-mono text-sm">{student.StudentCode || "—"}</td>
                        <td className="px-2.5 py-1.5">
                          <div className="font-medium">{studentName(student)}</div>
                          <div className="text-xs theme-text-muted">{student.Email ?? student.email ?? ""}</div>
                        </td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap theme-text-soft">{student.PhoneNumber ?? student.phoneNumber ?? "Not provided"}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap theme-text-soft">{student.Cohort || "—"}</td>
                        <td className="px-2.5 py-1.5"><Badge tone="info">{studentSectionLabel(student)}</Badge></td>
                        <td className="px-2.5 py-1.5"><Badge tone={active ? "success" : "danger"}>{active ? "Active" : "Inactive"}</Badge></td>
                        <td className="px-2.5 py-1.5">
                          <div className="flex flex-wrap gap-3">
                            <button type="button" className="theme-text-primary underline underline-offset-4" onClick={() => router.push(`/admin/students/${id}`)}>View</button>
                            <button type="button" className="theme-text-soft underline underline-offset-4" onClick={() => router.push(`/admin/students/${id}/edit`)}>Edit</button>
                            <button type="button" className={active ? "text-amber-600 underline underline-offset-4" : "text-emerald-700 underline underline-offset-4"} onClick={() => void handleToggleStatus(student)}>
                              {active ? "Deactivate" : "Activate"}
                            </button>
                            <button type="button" className="text-red-600 underline underline-offset-4" onClick={() => void handleDelete(student)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
