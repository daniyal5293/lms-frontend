"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { listAttendance } from "@/src/lib/api/attendance.api";
import { listExams, type Exam } from "@/src/lib/api/exams.api";
import { ApiError } from "@/src/lib/api/client";
import { listTeachers } from "@/src/lib/api/teachers.api";
import { listTeacherSectionCoursesByTeacherId } from "@/src/lib/api/teacher-section-course.api";
import type {
  Attendance,
  Teacher,
  TeacherSectionCourse,
} from "@/src/lib/types";

const assignmentId = (assignment: TeacherSectionCourse) =>
  assignment.TeacherSectionCourseId ??
  assignment.teacherSectionCourseId ??
  "";

const courseId = (assignment: TeacherSectionCourse) =>
  assignment.CourseId ??
  assignment.courseId ??
  assignment.Course?.CourseId ??
  assignment.course?.courseId ??
  "";

const sectionId = (assignment: TeacherSectionCourse) =>
  assignment.SectionId ??
  assignment.sectionId ??
  assignment.Section?.SectionId ??
  assignment.section?.sectionId ??
  "";

const courseName = (assignment: TeacherSectionCourse) =>
  assignment.Course?.CourseName ??
  assignment.Course?.courseName ??
  assignment.course?.CourseName ??
  assignment.course?.courseName ??
  "Course name unavailable";

const sectionName = (assignment: TeacherSectionCourse) =>
  assignment.Section?.SectionName ??
  assignment.Section?.sectionName ??
  assignment.section?.SectionName ??
  assignment.section?.sectionName ??
  "Section name unavailable";

const getTeacherId = (teacher: Teacher | undefined) =>
  teacher?.teacher_id ??
  teacher?.Id ??
  teacher?.id ??
  "";

export default function TeacherPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [assignments, setAssignments] = useState<
    TeacherSectionCourse[]
  >([]);

  const [exams, setExams] = useState<Exam[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeacherData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // First get teachers only
      const teachers = await listTeachers();

      console.log("Logged-in user:", user);
      console.log("Teachers API response:", teachers);

      const currentUserEmail = (user.Email ?? "")
        .trim()
        .toLowerCase();

      const teacher = teachers.find((item) => {
        const teacherEmail = (item.Email ?? item.email ?? "")
          .trim()
          .toLowerCase();

        return teacherEmail === currentUserEmail;
      });

      console.log("Matched teacher:", teacher);

      const teacherEntityId = getTeacherId(teacher);

      console.log("Teacher entity ID:", teacherEntityId);

      if (!teacherEntityId) {
        throw new Error(
          "Could not find the Teacher ID for the currently logged-in user."
        );
      }

      // Get assignments using the NEW API
      const assignmentData =
        await listTeacherSectionCoursesByTeacherId(
          teacherEntityId
        );

      console.log(
        "Teacher assignments API response:",
        assignmentData
      );

      setAssignments(assignmentData);

      const ownAssignmentIds = new Set(
        assignmentData
          .map(assignmentId)
          .filter(Boolean)
      );

      // These APIs should not prevent assignments from loading
      const [examResult, attendanceResult] =
        await Promise.allSettled([
          listExams(),
          listAttendance(),
        ]);

      if (examResult.status === "fulfilled") {
        setExams(
          examResult.value.filter((exam) =>
            ownAssignmentIds.has(
              exam.TeacherSectionCourseId ??
                exam.teacherSectionCourseId ??
                ""
            )
          )
        );
      } else {
        console.error("Failed to load exams:", {
  error: examResult.reason,
  message:
    examResult.reason instanceof ApiError
      ? examResult.reason.message
      : "Unknown error",
  status:
    examResult.reason instanceof ApiError
      ? examResult.reason.status
      : undefined,
  details:
    examResult.reason instanceof ApiError
      ? examResult.reason.details
      : undefined,
});
        setExams([]);
      }

      if (attendanceResult.status === "fulfilled") {
        setAttendance(
          attendanceResult.value.filter((record) =>
            ownAssignmentIds.has(
              record.TeacherSectionCourseId
            )
          )
        );
      } else {
        console.error("Failed to load attendance:", {
  error: attendanceResult.reason,
  message:
    attendanceResult.reason instanceof ApiError
      ? attendanceResult.reason.message
      : "Unknown error",
  status:
    attendanceResult.reason instanceof ApiError
      ? attendanceResult.reason.status
      : undefined,
  details:
    attendanceResult.reason instanceof ApiError
      ? attendanceResult.reason.details
      : undefined,
});
        setAttendance([]);
      }
    } catch (error) {
      console.error(
        "Teacher Area load error:",
        error
      );

      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unable to load teacher data.";

      notify(
        "error",
        "Teacher data unavailable",
        message
      );

      setAssignments([]);
      setExams([]);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [notify, user]);

  useEffect(() => {
    void loadTeacherData();
  }, [loadTeacherData]);

  return (
    <ProtectedRoute allowedRoles={["Teacher", "HOD"]}>
      <AppShell>
        <PageHeader
          title="Teacher Area"
          description="Work with your assigned courses, exams, and attendance."
        />

        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Assigned courses and sections
            </h2>

            <Badge tone="info">
              {loading
                ? "Loading"
                : `${assignments.length} assigned`}
            </Badge>
          </div>

          {assignments.length === 0 && !loading ? (
            <p className="py-8 text-sm text-[#888888]">
              No assignments were found for this teacher.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assignments.map((assignment) => {
                const id = assignmentId(assignment);
                const course = courseId(assignment);
                const section = sectionId(assignment);

                return (
                  <div
                    key={id || `${course}-${section}`}
                    className="rounded-xl border border-white/10 bg-[#111111] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">
                          {courseName(assignment)}
                        </h3>

                        <p className="mt-1 text-sm text-[#888888]">
                          Section {sectionName(assignment)}
                        </p>
                      </div>

                      <Badge
                        tone={
                          assignment.IsActive ??
                          assignment.isActive
                            ? "success"
                            : "warning"
                        }
                      >
                        {assignment.IsActive ??
                        assignment.isActive
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="secondary"
                        disabled={!id}
                        onClick={() =>
                          router.push(
                            `/teacher/attendance?assignmentId=${encodeURIComponent(
                              id
                            )}&courseId=${encodeURIComponent(
                              course
                            )}&sectionId=${encodeURIComponent(
                              section
                            )}`
                          )
                        }
                      >
                        Attendance
                      </Button>

                      <Button
                        disabled={!id}
                        onClick={() =>
                          router.push(
                            `/teacher/exams/new?assignmentId=${encodeURIComponent(
                              id
                            )}&courseId=${encodeURIComponent(
                              course
                            )}&sectionId=${encodeURIComponent(
                              section
                            )}`
                          )
                        }
                      >
                        Create exam
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                My exams
              </h2>

              <Badge tone="info">{exams.length}</Badge>
            </div>

            {exams.length === 0 ? (
              <p className="text-sm text-[#888888]">
                No exams found.
              </p>
            ) : (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div
                    key={
                      exam.ExamId ??
                      exam.examId ??
                      `${exam.Title ?? exam.title}-${exam.ExamDate ?? exam.examDate}`
                    }
                    className="border-b border-white/10 pb-3"
                  >
                    <div className="flex justify-between gap-3">
                      <span>
                        {exam.Title ??
                          exam.title ??
                          "Untitled exam"}
                      </span>

                      <Badge
                        tone={
                          exam.IsPublished ?? exam.isPublished
                            ? "success"
                            : "warning"
                        }
                      >
                        {exam.IsPublished ?? exam.isPublished
                          ? "Published"
                          : "Draft"}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-[#888888]">
                      {exam.ExamType ?? exam.examType ?? "Exam"} ·{" "}
                      {exam.ExamDate ??
                        exam.examDate ??
                        "Date unavailable"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Attendance records
              </h2>

              <Badge tone="info">
                {attendance.length}
              </Badge>
            </div>

            {attendance.length === 0 ? (
              <p className="text-sm text-[#888888]">
                No attendance records found.
              </p>
            ) : (
              <div className="space-y-3">
                {attendance.slice(0, 8).map((record) => (
                  <div
                    key={record.AttendanceId}
                    className="flex justify-between gap-3 border-b border-white/10 pb-3"
                  >
                    <div>
                      <span>
                        {record.StudentFullName ?? "Student"}
                      </span>

                      <p className="text-xs text-[#888888]">
                        {record.SectionName ?? "Section"} ·{" "}
                        {record.AttendanceDate}
                      </p>
                    </div>

                    <Badge
                      tone={
                        record.Status === "Present"
                          ? "success"
                          : "warning"
                      }
                    >
                      {record.Status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}