"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Select } from "@/src/components/ui/Select";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import {
  listExamsByTeacherId,
  type Exam,
} from "@/src/lib/api/exams.api";
import { listResultsByExamId } from "@/src/lib/api/exams.api";
import { ApiError } from "@/src/lib/api/client";
import { listTeachers } from "@/src/lib/api/teachers.api";
import { listTeacherSectionCoursesByTeacherId } from "@/src/lib/api/teacher-section-course.api";
import type {
  Teacher,
  TeacherSectionCourse,
} from "@/src/lib/types";

const assignmentId = (assignment: TeacherSectionCourse) =>
  assignment.TeacherSectionCourseId ??
  assignment.teacherSectionCourseId ??
  "";

const sectionId = (assignment: TeacherSectionCourse) =>
  assignment.SectionId ??
  assignment.sectionId ??
  assignment.Section?.SectionId ??
  assignment.section?.sectionId ??
  "";

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

const getExamId = (exam: Exam) =>
  exam.ExamId ??
  exam.examId ??
  exam.examID ??
  "";

const getExamAssignmentId = (exam: Exam) =>
  exam.TeacherSectionCourseId ??
  exam.teacherSectionCourseId ??
  "";

const getExamTitle = (exam: Exam) =>
  exam.Title ??
  exam.title ??
  "Untitled exam";

const getExamTypeId = (exam: Exam) =>
  exam.ExamTypeId ??
  exam.examTypeId ??
  "";

const getExamDate = (exam: Exam) =>
  exam.ExamDate ??
  exam.examDate ??
  "";

const getTotalMarks = (exam: Exam) =>
  exam.TotalMarks ??
  exam.totalMarks ??
  0;

const isExamPublished = (exam: Exam) =>
  exam.IsPublished ??
  exam.isPublished ??
  false;

export default function TeacherExamsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [assignments, setAssignments] = useState<
    TeacherSectionCourse[]
  >([]);

  const [exams, setExams] = useState<Exam[]>([]);
  const [uploadedExamIds, setUploadedExamIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");

  const loadTeacherData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const teachers = await listTeachers();

      const currentUserEmail = (user.Email ?? "")
        .trim()
        .toLowerCase();

      const teacher = teachers.find((item) => {
        const teacherEmail = (
          item.Email ??
          item.email ??
          ""
        )
          .trim()
          .toLowerCase();

        return teacherEmail === currentUserEmail;
      });

      const teacherEntityId = getTeacherId(teacher);

      if (!teacherEntityId) {
        throw new Error(
          "Could not find the Teacher ID for the currently logged-in user."
        );
      }

      const [assignmentData, examData] = await Promise.all([
        listTeacherSectionCoursesByTeacherId(teacherEntityId),
        listExamsByTeacherId(teacherEntityId),
      ]);

      setAssignments(assignmentData);
      setExams(examData);

      const resultChecks = await Promise.all(
        examData.map(async (exam) => {
          const examId = getExamId(exam);
          const assignment = assignmentData.find((item) => assignmentId(item) === getExamAssignmentId(exam));
          const currentSectionId = assignment ? sectionId(assignment) : "";
          if (!examId || !currentSectionId) return [examId, false] as const;
          const results = await listResultsByExamId(examId).catch(() => []);
          return [examId, results.length > 0] as const;
        }),
      );
      setUploadedExamIds(new Set(resultChecks.filter(([, hasResults]) => hasResults).map(([id]) => id)));

      const firstSectionId = sectionId(assignmentData[0]);

      setActiveSectionId(firstSectionId);
      setSelectedAssignmentId(assignmentId(assignmentData[0]));
    } catch (error) {
      console.error("Teacher exams load error:", error);

      const message =
        error instanceof ApiError
          ? error.message || "Unable to load teacher exams."
          : error instanceof Error
            ? error.message
            : "Unable to load teacher exams.";

      notify(
        "error",
        "Teacher data unavailable",
        message
      );

      setAssignments([]);
      setExams([]);
      setActiveSectionId("");
      setSelectedAssignmentId("");
    } finally {
      setLoading(false);
    }
  }, [notify, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTeacherData();
  }, [loadTeacherData]);

  /*
   * One tab per unique section.
   */
  const sections = useMemo(() => {
    const uniqueSections = new Map<
      string,
      TeacherSectionCourse
    >();

    assignments.forEach((assignment) => {
      const id = sectionId(assignment);

      if (id && !uniqueSections.has(id)) {
        uniqueSections.set(id, assignment);
      }
    });

    return Array.from(uniqueSections.values());
  }, [assignments]);

  /*
   * Get all TeacherSectionCourse IDs
   * belonging to the selected section.
   */
  const activeSectionAssignmentIds = useMemo(() => {
    return new Set(
      assignments
        .filter(
          (assignment) =>
            sectionId(assignment) === activeSectionId
        )
        .map(assignmentId)
        .filter(Boolean)
    );
  }, [activeSectionId, assignments]);

  /*
   * Only show exams belonging to the
   * selected section.
   */
  const sectionExams = useMemo(() => {
    return exams.filter((exam) =>
      activeSectionAssignmentIds.has(
        getExamAssignmentId(exam)
      )
    );
  }, [activeSectionAssignmentIds, exams]);

  const selectedAssignment = assignments.find(
    (assignment) => assignmentId(assignment) === selectedAssignmentId,
  );

  const handleAssignmentChange = (nextAssignmentId: string) => {
    setSelectedAssignmentId(nextAssignmentId);

    const assignment = assignments.find(
      (item) => assignmentId(item) === nextAssignmentId,
    );

    setActiveSectionId(assignment ? sectionId(assignment) : "");
  };

  /*
   * Find the assignment belonging to an exam.
   *
   * This is needed to get the SectionId when
   * opening Upload Result.
   */
  const getAssignmentForExam = useCallback(
    (exam: Exam) => {
      const examAssignmentId = getExamAssignmentId(exam);

      return assignments.find(
        (assignment) =>
          assignmentId(assignment) === examAssignmentId
      );
    },
    [assignments]
  );

  const handleUploadResult = (exam: Exam) => {
    const examId = getExamId(exam);

    if (!examId) {
      notify(
        "error",
        "Unable to upload result",
        "This exam does not have a valid exam ID."
      );
      return;
    }

    const assignment = getAssignmentForExam(exam);

    if (!assignment) {
      notify(
        "error",
        "Unable to upload result",
        "Could not find the course and section for this exam."
      );
      return;
    }

    const currentSectionId = sectionId(assignment);

    if (!currentSectionId) {
      notify(
        "error",
        "Unable to upload result",
        "Could not determine the section for this exam."
      );
      return;
    }

    const totalMarks = getTotalMarks(exam);

    router.push(
      `/teacher/exams/${encodeURIComponent(
        examId
      )}/results?sectionId=${encodeURIComponent(
        currentSectionId
      )}&totalMarks=${encodeURIComponent(
        String(totalMarks)
      )}`
    );
  };

  return (
    <ProtectedRoute allowedRoles={["Teacher", "HOD"]}>
      <AppShell>
        <PageHeader
          title="Teacher Area"
          description="Manage your assigned courses, sections, and exams."
        />

        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                My exams
              </h2>

              <p className="mt-1 text-sm text-[#888888]">
                Select a section to view its exams.
              </p>
            </div>

            <Badge tone="info">
              {sectionExams.length} exams
            </Badge>
          </div>

          <div className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
            <Select
              label="Assigned course and section"
              value={selectedAssignmentId}
              onChange={(event) =>
                handleAssignmentChange(event.target.value)
              }
              disabled={loading || assignments.length === 0}
            >
              <option value="">
                {loading
                  ? "Loading assignments..."
                  : "Select assignment"}
              </option>

              {assignments.map((assignment) => (
                <option
                  key={assignmentId(assignment)}
                  value={assignmentId(assignment)}
                >
                  {assignment.Course?.CourseName ??
                    assignment.Course?.courseName ??
                    assignment.course?.CourseName ??
                    assignment.course?.courseName ??
                    "Course"}{" "}
                  -{" "}
                  {sectionName(assignment)}
                </option>
              ))}
            </Select>

            <Button
              disabled={!selectedAssignment}
              onClick={() =>
                router.push(
                  `/teacher/exams/new?assignmentId=${encodeURIComponent(
                    selectedAssignmentId,
                  )}`,
                )
              }
            >
              Create exam
            </Button>

            <Button
              variant="secondary"
              disabled={!selectedAssignment}
              onClick={() =>
                router.push(
                  `/teacher/attendance?assignmentId=${encodeURIComponent(
                    selectedAssignmentId,
                  )}`,
                )
              }
            >
              Mark attendance
            </Button>
          </div>

          {sections.length === 0 && !loading ? (
            <p className="py-8 text-sm text-[#888888]">
              No sections are available.
            </p>
          ) : (
            <>
              {/* SECTION NAVIGATION */}
              <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
                {sections.map((assignment) => {
                  const id = sectionId(assignment);
                  const name = sectionName(assignment);
                  const active =
                    id === activeSectionId;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setActiveSectionId(id)
                      }
                      className={[
                        "rounded-lg px-4 py-2 text-sm font-medium transition",
                        active
                          ? "bg-white text-black"
                          : "border border-white/10 bg-[#111111] text-[#aaaaaa] hover:text-white",
                      ].join(" ")}
                    >
                      Section {name}
                    </button>
                  );
                })}
              </div>

              {/* EXAMS */}
              {loading ? (
                <p className="py-8 text-sm text-[#888888]">
                  Loading exams...
                </p>
              ) : sectionExams.length === 0 ? (
                <p className="py-8 text-sm text-[#888888]">
                  No exams found for this section.
                </p>
              ) : (
                <div className="space-y-3">
                  {sectionExams.map((exam) => (
                    <div
                      key={
                        getExamId(exam) ||
                        `${getExamTitle(exam)}-${getExamDate(
                          exam
                        )}`
                      }
                      className="rounded-xl border border-white/10 bg-[#111111] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">
                            {getExamTitle(exam)}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#888888]">
                            <span>
                              Date:{" "}
                              {getExamDate(exam) ||
                                "Date unavailable"}
                            </span>

                            <span>•</span>

                            <span>
                              Total marks:{" "}
                              {getTotalMarks(exam)}
                            </span>
                          </div>
                        </div>

                        <Badge
                          tone={
                            isExamPublished(exam)
                              ? "success"
                              : "warning"
                          }
                        >
                          {isExamPublished(exam)
                            ? "Published"
                            : "Draft"}
                        </Badge>
                      </div>

                      <p className="mt-3 text-xs text-[#666666]">
                        Exam Type ID:{" "}
                        {getExamTypeId(exam) ||
                          "Unavailable"}
                      </p>

                      {/* ACTIONS */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          disabled={uploadedExamIds.has(getExamId(exam))}
                          onClick={() =>
                            handleUploadResult(exam)
                          }
                        >
                          Upload Result
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            handleUploadResult(exam)
                          }
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}