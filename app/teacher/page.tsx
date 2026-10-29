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
import { GroupedOptions } from "@/src/components/ui/GroupedOptions";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import {
  listExamsByTeacherId,
  listExamTypes,
  publishExamResults,
  type Exam,
  type ExamType,
} from "@/src/lib/api/exams.api";
import { listResultsByExamId } from "@/src/lib/api/exams.api";
import { ApiError } from "@/src/lib/api/client";
import { listTeachers } from "@/src/lib/api/teachers.api";
import { listTeacherSectionCoursesByTeacherId } from "@/src/lib/api/teacher-section-course.api";
import { assignmentClass, assignmentLabel, assignmentSectionName, sortAssignments } from "@/src/lib/utils/assignment";
import { shortProgramName } from "@/src/lib/utils";
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
  assignment.Section?.SectionID ??
  assignment.Section?.Id ??
  assignment.section?.SectionID ??
  assignment.section?.Id ??
  assignment.section?.sectionId ??
  "";

const normalizedId = (value: string) => value.trim().toLowerCase();

const sectionName = (assignment: TeacherSectionCourse) =>
  shortProgramName(assignmentSectionName(assignment)) || "Section name unavailable";

const classGroup = (assignment: TeacherSectionCourse) => `Class ${assignmentClass(assignment) || "—"}`;

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

const getReadableExamTitle = (exam: Exam) =>
  getExamTitle(exam).replace(/\s+(?:for|of)\s+[0-9a-f]{8}-[0-9a-f-]{27,36}\b/i, "").trim() || "Untitled exam";

const getExamTypeId = (exam: Exam) =>
  exam.ExamTypeId ??
  exam.examTypeId ??
  "";

const getExamTypeLabel = (exam: Exam, examTypes: ExamType[]) => {
  const examTypeId = getExamTypeId(exam).toLowerCase();
  const examType = examTypes.find((item) => item.examTypeId.toLowerCase() === examTypeId);
  return examType?.type ?? (exam.ExamType ?? exam.examType ?? "Exam type unavailable");
};

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
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
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

      const [assignmentData, examData, examTypeData] = await Promise.all([
        listTeacherSectionCoursesByTeacherId(teacherEntityId),
        listExamsByTeacherId(teacherEntityId),
        listExamTypes(),
      ]);

      setAssignments(sortAssignments(assignmentData));
      setExams(examData);
      setExamTypes(examTypeData);

      const resultChecks = await Promise.all(
        examData.map(async (exam) => {
          const examId = getExamId(exam);
          const assignment = assignmentData.find((item) => normalizedId(assignmentId(item)) === normalizedId(getExamAssignmentId(exam)));
          const currentSectionId = assignment ? sectionId(assignment) : "";
          if (!examId || !currentSectionId) return [examId, false] as const;
          const results = await listResultsByExamId(examId).catch(() => []);
          return [examId, results.length > 0] as const;
        }),
      );
      setUploadedExamIds(new Set(resultChecks.filter(([, hasResults]) => hasResults).map(([id]) => id)));

      const firstSectionId = normalizedId(sectionId(assignmentData[0]));

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
      setExamTypes([]);
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
      const id = normalizedId(sectionId(assignment));

      if (id && !uniqueSections.has(id)) {
        uniqueSections.set(id, assignment);
      }
    });

    return Array.from(uniqueSections.values());
  }, [assignments]);

  /*
   * Section tabs grouped by class (e.g. Class XI, Class XII).
   */
  const sectionGroups = useMemo(() => {
    const groups = new Map<string, TeacherSectionCourse[]>();

    sections
      .slice()
      .sort((a, b) => sectionName(a).localeCompare(sectionName(b)))
      .forEach((assignment) => {
        const group = classGroup(assignment);
        groups.set(group, [...(groups.get(group) ?? []), assignment]);
      });

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sections]);

  /*
   * Get all TeacherSectionCourse IDs
   * belonging to the selected section.
   */
  const activeSectionAssignmentIds = useMemo(() => {
    return new Set(
      assignments
        .filter(
          (assignment) =>
            normalizedId(sectionId(assignment)) === normalizedId(activeSectionId)
        )
          .map((assignment) => normalizedId(assignmentId(assignment)))
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
        normalizedId(getExamAssignmentId(exam))
      )
    );
  }, [activeSectionAssignmentIds, exams]);

  const selectedAssignment = assignments.find(
    (assignment) => normalizedId(assignmentId(assignment)) === normalizedId(selectedAssignmentId),
  );

  const handleAssignmentChange = (nextAssignmentId: string) => {
    setSelectedAssignmentId(nextAssignmentId);

    const assignment = assignments.find(
      (item) => normalizedId(assignmentId(item)) === normalizedId(nextAssignmentId),
    );

    setActiveSectionId(assignment ? normalizedId(sectionId(assignment)) : "");
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

  const [publishingId, setPublishingId] = useState("");

  // Students only see marks once the exam is published; the server checks this teacher owns the exam
  const handleTogglePublish = async (exam: Exam) => {
    const examId = getExamId(exam);
    if (!examId) return;
    const next = !isExamPublished(exam);
    if (next && !window.confirm(`Publish results for "${getReadableExamTitle(exam)}"? Students will be able to see their marks.`)) return;

    setPublishingId(examId);
    try {
      await publishExamResults(examId, next);
      setExams((current) =>
        current.map((item) => (getExamId(item) === examId ? { ...item, IsPublished: next, isPublished: next } : item)),
      );
      notify("success", next ? "Results published" : "Results unpublished", next ? "Students can now see their marks." : "Marks are hidden from students again.");
    } catch (error) {
      notify("error", "Publishing failed", error instanceof ApiError ? error.message : "Unable to update the exam.");
    } finally {
      setPublishingId("");
    }
  };

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

              <p className="mt-1 text-sm theme-text-muted">
                Select a section to view its exams.
              </p>
            </div>

            <Badge tone="info">
              {sectionExams.length} exams
            </Badge>
          </div>

          <div className="mb-6 grid gap-4 rounded-xl border border-black/10 theme-bg-page p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
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

              <GroupedOptions
                items={assignments}
                groupOf={classGroup}
                valueOf={assignmentId}
                labelOf={assignmentLabel}
              />
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

          </div>

          {sections.length === 0 && !loading ? (
            <p className="py-8 text-sm theme-text-muted">
              No sections are available.
            </p>
          ) : (
            <>
              {/* SECTION NAVIGATION */}
              <div className="mb-6 space-y-2 border-b border-black/10 pb-4">
                {sectionGroups.map(([group, groupSections]) => (
                  <div key={group} className="flex flex-wrap items-center gap-2">
                    <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide theme-text-muted">
                      {group}
                    </span>
                    {groupSections.map((assignment) => {
                      const id = sectionId(assignment);
                      const active =
                        normalizedId(id) === normalizedId(activeSectionId);

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
                              ? "theme-bg-primary theme-text-on-primary"
                              : "border border-black/10 theme-bg-page theme-text-muted hover:theme-text",
                          ].join(" ")}
                        >
                          {sectionName(assignment)}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* EXAMS */}
              {loading ? (
                <p className="py-8 text-sm theme-text-muted">
                  Loading exams...
                </p>
              ) : sectionExams.length === 0 ? (
                <p className="py-8 text-sm theme-text-muted">
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
                      className="rounded-xl border border-black/10 theme-bg-page p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">
                            {getReadableExamTitle(exam)}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2 text-sm theme-text-muted">
                            <span>
                              Date:{" "}
                              {getExamDate(exam) ||
                                "Date unavailable"}
                            </span>

                            <span aria-hidden="true">·</span>

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

                      <p className="mt-3 text-xs theme-text-muted">
                        Exam type: {getExamTypeLabel(exam, examTypes)}
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
                        <Button
                          variant={isExamPublished(exam) ? "ghost" : "primary"}
                          loading={publishingId === getExamId(exam)}
                          disabled={!isExamPublished(exam) && !uploadedExamIds.has(getExamId(exam))}
                          title={!isExamPublished(exam) && !uploadedExamIds.has(getExamId(exam)) ? "Upload results before publishing" : undefined}
                          onClick={() => void handleTogglePublish(exam)}
                        >
                          {isExamPublished(exam) ? "Unpublish" : "Publish Result"}
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





