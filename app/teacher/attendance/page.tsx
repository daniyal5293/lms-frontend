"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import {
  markBulkAttendance,
} from "@/src/lib/api/attendance.api";
import { listStudents } from "@/src/lib/api/students.api";
import {
  listTeacherSectionCoursesByTeacherId,
} from "@/src/lib/api/teacher-section-course.api";
import { listTeachers } from "@/src/lib/api/teachers.api";
import { getTeacherEntityId } from "@/src/lib/utils/teacher";
import type {
  AttendanceStatus,
  Student,
  TeacherSectionCourse,
} from "@/src/lib/types";

const statuses: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Leave",
];

const getId = (student: Student) =>
  student.EnrollmentId ??
  student.enrollmentId ??
  student.Id ??
  student.id ??
  "";

const getName = (student: Student) =>
  student.FullName ??
  student.fullName ??
  "Unnamed student";

const getAssignmentId = (
  assignment: TeacherSectionCourse
) =>
  assignment.TeacherSectionCourseId ??
  assignment.teacherSectionCourseId ??
  "";

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [assignments, setAssignments] = useState<
    TeacherSectionCourse[]
  >([]);

  const [students, setStudents] = useState<Student[]>([]);
  const [assignmentId, setAssignmentId] = useState("");

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [statusByStudent, setStatusByStudent] =
    useState<Record<string, AttendanceStatus>>({});

  const [remarksByStudent, setRemarksByStudent] =
    useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Step 1: Find the current teacher
        const teachers = await listTeachers();

        const teacherId = getTeacherEntityId(
          teachers,
          user
        );

        if (!teacherId) {
          notify(
            "error",
            "Teacher profile unavailable",
            "No teacher profile was found for the logged-in user."
          );

          setAssignments([]);
          setStudents([]);
          return;
        }

        // Step 2: Get only this teacher's assignments
        const [assignmentData, studentData] =
          await Promise.all([
            listTeacherSectionCoursesByTeacherId(
              teacherId
            ),
            listStudents(),
          ]);

        setAssignments(assignmentData);
        setStudents(studentData);

        const queryAssignmentId =
          new URLSearchParams(
            window.location.search
          ).get("assignmentId");

        const selectedId =
          assignmentData.some(
            (assignment) =>
              getAssignmentId(assignment) ===
              queryAssignmentId
          )
            ? queryAssignmentId
            : getAssignmentId(assignmentData[0]);

        setAssignmentId(selectedId ?? "");
      } catch (error) {
        notify(
          "error",
          "Attendance unavailable",
          error instanceof ApiError
            ? error.message
            : "Unable to load attendance data."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [notify, user]);

  const selectedAssignment = assignments.find(
    (assignment) =>
      getAssignmentId(assignment) === assignmentId
  );

  const sectionId =
    selectedAssignment?.SectionId ??
    selectedAssignment?.sectionId ??
    selectedAssignment?.Section?.SectionId ??
    selectedAssignment?.section?.SectionId ??
    selectedAssignment?.section?.sectionId ??
    "";

  const sectionStudents = useMemo(
    () =>
      students.filter((student) => {
        const studentSectionId =
          student.SectionId ??
          student.sectionId ??
          student.Section?.Id ??
          student.Section?.id ??
          student.Section?.sectionId;

        return (
          !sectionId ||
          studentSectionId === sectionId
        );
      }),
    [sectionId, students]
  );

  const submit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const entries = sectionStudents
      .map((student) => ({
        StudentEnrollmentId: getId(student),

        Status:
          statusByStudent[getId(student)] ??
          "Present",

        Remarks:
          remarksByStudent[getId(student)] ||
          undefined,
      }))
      .filter((entry) => entry.StudentEnrollmentId);

    if (
      !assignmentId ||
      !date ||
      entries.length === 0
    ) {
      notify(
        "error",
        "Validation failed",
        "Select an assignment and ensure students have enrollment IDs."
      );
      return;
    }

    setSubmitting(true);

    try {
      await markBulkAttendance({
        TeacherSectionCourseId: assignmentId,
        AttendanceDate: `${date}T00:00:00`,
        Entries: entries,
      });

      notify(
        "success",
        "Attendance saved",
        `${entries.length} attendance records were submitted.`
      );
    } catch (error) {
      notify(
        "error",
        "Attendance failed",
        error instanceof ApiError
          ? error.message
          : "Unable to save attendance."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Teacher", "HOD"]}>
      <AppShell>
        <PageHeader
          title="Mark attendance"
          description="Record attendance for students in an assigned course and section."
        />

        <Card>
          <form
            className="space-y-6"
            onSubmit={submit}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Select
                label="Course and section"
                value={assignmentId}
                onChange={(event) =>
                  setAssignmentId(event.target.value)
                }
                disabled={loading}
              >
                <option value="">
                  {loading
                    ? "Loading assignments..."
                    : "Select assignment"}
                </option>

                {assignments.map((assignment) => (
                  <option
                    key={getAssignmentId(assignment)}
                    value={getAssignmentId(assignment)}
                  >
                    {assignment.Course?.CourseName ??
                      assignment.Course?.courseName ??
                      assignment.course?.CourseName ??
                      assignment.course?.courseName ??
                      "Course"}{" "}
                    -{" "}
                    {assignment.Section?.SectionName ??
                      assignment.Section?.sectionName ??
                      assignment.section?.SectionName ??
                      assignment.section?.sectionName ??
                      "Section"}
                  </option>
                ))}
              </Select>

              <Input
                label="Attendance date"
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
              />
            </div>

            {sectionStudents.length === 0 ? (
              <p className="py-8 text-sm text-[#888888]">
                No students with enrollment records were found
                for this section.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="px-3 py-3 text-[#888888]">
                        Student
                      </th>

                      <th className="px-3 py-3 text-[#888888]">
                        Status
                      </th>

                      <th className="px-3 py-3 text-[#888888]">
                        Remarks
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sectionStudents.map((student) => {
                      const id = getId(student);

                      return (
                        <tr
                          key={id}
                          className="border-b border-white/5"
                        >
                          <td className="px-3 py-3">
                            {getName(student)}
                          </td>

                          <td className="px-3 py-3">
                            <Select
                              aria-label={`Attendance status for ${getName(
                                student
                              )}`}
                              value={
                                statusByStudent[id] ??
                                "Present"
                              }
                              onChange={(event) =>
                                setStatusByStudent(
                                  (current) => ({
                                    ...current,
                                    [id]:
                                      event.target
                                        .value as AttendanceStatus,
                                  })
                                )
                              }
                            >
                              {statuses.map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status}
                                </option>
                              ))}
                            </Select>
                          </td>

                          <td className="px-3 py-3">
                            <Input
                              aria-label={`Remarks for ${getName(
                                student
                              )}`}
                              value={
                                remarksByStudent[id] ?? ""
                              }
                              onChange={(event) =>
                                setRemarksByStudent(
                                  (current) => ({
                                    ...current,
                                    [id]:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder="Optional"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={submitting}
              >
                {submitting
                  ? "Saving..."
                  : "Save attendance"}
              </Button>
            </div>
          </form>
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}