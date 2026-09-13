"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { ApiError } from "@/src/lib/api/client";
import { deleteStudent, exportStudents, listStudents } from "@/src/lib/api/students.api";
import type { Student } from "@/src/lib/types";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";

const studentId = (student: Student) => student.Id ?? student.id ?? student.StudentId ?? student.studentId ?? student.student_id ?? "";
const studentName = (student: Student) => student.FullName ?? student.fullName ?? "Unnamed student";

export default function StudentsPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
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
    return value ? students.filter((student) => `${studentName(student)} ${student.Email ?? student.email ?? ""} ${student.CNIC ?? student.cnic ?? ""}`.toLowerCase().includes(value)) : students;
  }, [query, students]);

  const handleDelete = async (student: Student) => {
    const id = studentId(student);
    if (!id || !window.confirm(`Delete ${studentName(student)}? This action cannot be undone.`)) return;
    try {
      await deleteStudent(id);
      notify("success", "Student deleted", "The student was removed successfully.");
      void loadStudents();
    } catch (error) {
      notify("error", "Deletion failed", error instanceof ApiError ? error.message : "Unable to delete student.");
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
        <PageHeader title="Students" description="Manage student accounts, section assignments, and enrollment records." actions={<div className="flex gap-2"><Button variant="secondary" onClick={handleExport}>Export Excel</Button><Button onClick={() => router.push("/admin/students/new")}>Add Student</Button></div>} />
        <Card className="mb-6"><div className="max-w-md"><Input label="Search" placeholder="Search by name, email, or CNIC" value={query} onChange={(event) => setQuery(event.target.value)} /></div></Card>
        <Card>
          {loading ? <div className="text-sm theme-text-muted">Loading students...</div> : filteredStudents.length === 0 ? <div className="py-8 text-center"><h3 className="text-lg font-semibold theme-text">No students found</h3><p className="mt-2 text-sm theme-text-muted">No student records match your search.</p></div> : (
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm theme-text"><thead className="border-b border-black/10"><tr><th className="px-3 py-3 theme-text-muted">Name</th><th className="px-3 py-3 theme-text-muted">Email</th><th className="px-3 py-3 theme-text-muted">Phone</th><th className="px-3 py-3 theme-text-muted">Section</th><th className="px-3 py-3 theme-text-muted">Enrollment</th><th className="px-3 py-3 theme-text-muted">Actions</th></tr></thead><tbody>{filteredStudents.map((student) => { const id = studentId(student); return <tr key={id || `${student.Email ?? student.email}-${studentName(student)}`} className="border-b border-black/5"><td className="px-3 py-3 font-medium">{studentName(student)}</td><td className="px-3 py-3 theme-text-soft">{student.Email ?? student.email ?? "Not provided"}</td><td className="px-3 py-3 theme-text-soft">{student.PhoneNumber ?? student.phoneNumber ?? "Not provided"}</td><td className="px-3 py-3"><Badge tone="info">{student.Section?.Name ?? student.Section?.sectionName ?? student.SectionId ?? student.sectionId ?? "Unassigned"}</Badge></td><td className="px-3 py-3 theme-text-soft">{student.EnrollmentDate ?? student.enrollmentDate ?? "Not provided"}</td><td className="px-3 py-3"><div className="flex gap-2"><button type="button" className="theme-text-primary underline" onClick={() => router.push(`/admin/students/${id}`)}>View</button><button type="button" className="theme-text-soft underline" onClick={() => router.push(`/admin/students/${id}/edit`)}>Edit</button><button type="button" className="text-red-300 underline" onClick={() => handleDelete(student)}>Delete</button></div></td></tr>; })}</tbody></table></div>
          )}
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}





