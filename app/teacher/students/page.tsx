"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Select } from "@/src/components/ui/Select";
import { GroupedOptions } from "@/src/components/ui/GroupedOptions";
import { ApiError } from "@/src/lib/api/client";
import { listStudentDetailsBySectionId, type SectionStudent } from "@/src/lib/api/exams.api";
import { listTeacherSectionCoursesByTeacherId } from "@/src/lib/api/teacher-section-course.api";
import { listTeachers } from "@/src/lib/api/teachers.api";
import { getTeacherEntityId } from "@/src/lib/utils/teacher";
import { assignmentClass, assignmentSectionLabel, sortAssignments } from "@/src/lib/utils/assignment";
import { formatSectionText } from "@/src/lib/utils";
import type { TeacherSectionCourse } from "@/src/lib/types";

const sectionId = (assignment: TeacherSectionCourse) => assignment.SectionId ?? assignment.sectionId ?? assignment.Section?.SectionId ?? assignment.section?.SectionId ?? assignment.section?.sectionId ?? "";
const studentName = (student: SectionStudent) => student.fullName ?? student.FullName ?? "Unnamed student";
const studentId = (student: SectionStudent) => student.studentId ?? student.StudentId ?? "";
const formatDate = (value?: string | null) => {
  if (!value || value.startsWith("0001-01-01")) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
};

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [assignments, setAssignments] = useState<TeacherSectionCourse[]>([]);
  const [students, setStudents] = useState<SectionStudent[]>([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadStudents = async () => {
      try {
        const teachers = await listTeachers();
        const teacherId = getTeacherEntityId(teachers, user);
        if (!teacherId) throw new Error("No teacher profile was found.");

        const assignmentData = await listTeacherSectionCoursesByTeacherId(teacherId);
        const sorted = sortAssignments(assignmentData);
        setAssignments(sorted);
        setSelectedSection(sectionId(sorted[0]) || "");
      } catch (error) {
        notify("error", "Students unavailable", error instanceof ApiError ? error.message : "Unable to load your students.");
      } finally {
        setLoading(false);
      }
    };

    void loadStudents();
  }, [notify, user]);

  const sections = useMemo(() => {
    const unique = new Map<string, TeacherSectionCourse>();
    assignments.forEach((assignment) => {
      const id = sectionId(assignment);
      if (id && !unique.has(id)) unique.set(id, assignment);
    });
    return Array.from(unique.values());
  }, [assignments]);

  useEffect(() => {
    if (!selectedSection) return;
    void listStudentDetailsBySectionId(selectedSection)
      .then(setStudents)
      .catch(() => {
        setStudents([]);
        notify("error", "Students unavailable", "Unable to load this section roster.");
      })
      .finally(() => setLoading(false));
  }, [notify, selectedSection]);

  const selectedSectionLabel = useMemo(() => {
    const match = sections.find((assignment) => sectionId(assignment) === selectedSection);
    return match ? assignmentSectionLabel(match) : "Unassigned";
  }, [sections, selectedSection]);

  const filteredStudents = students.filter((student) => studentName(student).toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <ProtectedRoute allowedRoles={["Teacher", "HOD"]}>
      <AppShell>
        <PageHeader title="Students" description="View the students assigned to your sections." />
        <div className="space-y-3">
          <Card className="flex flex-wrap items-end gap-2.5">
            <div className="min-w-64 flex-1">
              <Select label="Section" value={selectedSection} onChange={(event) => { setLoading(true); setSelectedSection(event.target.value); }} disabled={sections.length === 0}>
                <GroupedOptions items={sections} groupOf={(assignment) => `Class ${assignmentClass(assignment) || "—"}`} valueOf={sectionId} labelOf={assignmentSectionLabel} />
              </Select>
            </div>
            <div className="min-w-64 flex-1">
              <Input label="Search students" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name" />
            </div>
            <Badge tone="info">{filteredStudents.length} students</Badge>
          </Card>

          <Card>
            {loading ? <p className="py-8 text-sm theme-text-muted">Loading students...</p> : filteredStudents.length === 0 ? <p className="py-8 text-sm theme-text-muted">No students found.</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-black/10 text-xs uppercase tracking-wide theme-text-muted"><tr><th className="px-2.5 py-1.5">Student</th><th className="px-2.5 py-1.5">Email</th><th className="px-2.5 py-1.5">Phone</th><th className="px-2.5 py-1.5">Date of birth</th><th className="px-2.5 py-1.5">CNIC</th></tr></thead>
                  <tbody>{filteredStudents.map((student) => <tr key={studentId(student) || student.email || studentName(student)} className="border-b border-black/5"><td className="px-2.5 py-1.5"><div className="font-medium">{studentName(student)}</div><div className="mt-1 text-xs theme-text-muted">{formatSectionText(student.section, selectedSectionLabel)}</div></td><td className="px-2.5 py-1.5 theme-text-muted">{student.email || "-"}</td><td className="px-2.5 py-1.5 theme-text-muted">{student.phoneNumber || "-"}</td><td className="px-2.5 py-1.5 theme-text-muted">{formatDate(student.dateOfBirth)}</td><td className="px-2.5 py-1.5 theme-text-muted">{student.cnic || "-"}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}