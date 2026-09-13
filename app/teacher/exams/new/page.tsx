"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  createExam,
  listExamTypes,
  type ExamType,
} from "@/src/lib/api/exams.api";
import { listTeachers } from "@/src/lib/api/teachers.api";
import {
  listTeacherSectionCoursesByTeacherId,
} from "@/src/lib/api/teacher-section-course.api";
import { getTeacherEntityId } from "@/src/lib/utils/teacher";
import type {
  TeacherSectionCourse,
} from "@/src/lib/types";

const initialState = {
  Title: "",
  ExamTypeId: "",
  TotalMarks: "",
  IsPublished: false,
  ExamDate: "",
  TeacherSectionCourseId: "",
};

const assignmentId = (
  assignment: TeacherSectionCourse
) =>
  assignment.TeacherSectionCourseId ??
  assignment.teacherSectionCourseId ??
  "";

export default function NewExamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [form, setForm] = useState(initialState);

  const [assignments, setAssignments] = useState<
    TeacherSectionCourse[]
  >([]);

  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Step 1: Get all teachers and find current teacher
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
          return;
        }

        // Step 2: Get only this teacher's assignments
        const [ownAssignments, typeData] =
          await Promise.all([
            listTeacherSectionCoursesByTeacherId(
              teacherId
            ),
            listExamTypes(),
          ]);

        const query = new URLSearchParams(
          window.location.search
        );

        const queryAssignmentId =
          query.get("assignmentId");

        const selected = ownAssignments.find(
          (assignment) =>
            assignmentId(assignment) ===
            queryAssignmentId
        );

        setAssignments(ownAssignments);
        setExamTypes(typeData);

        setForm((current) => ({
          ...current,
          TeacherSectionCourseId: assignmentId(
            selected ?? ownAssignments[0]
          ),
        }));
      } catch (error) {
        notify(
          "error",
          "Exam setup failed",
          error instanceof ApiError
            ? error.message
            : "Unable to load exam options."
        );
      }
    };

    void loadData();
  }, [notify, user]);

  const selectedAssignment = assignments.find(
    (assignment) =>
      assignmentId(assignment) ===
      form.TeacherSectionCourseId
  );

  const fromAssignmentCard =
    typeof window !== "undefined" &&
    new URLSearchParams(
      window.location.search
    ).has("assignmentId");

  const assignmentLabel = selectedAssignment
    ? `${
        selectedAssignment.Course?.CourseName ??
        selectedAssignment.Course?.courseName ??
        selectedAssignment.course?.CourseName ??
        selectedAssignment.course?.courseName ??
        "Course"
      } - ${
        selectedAssignment.Section?.SectionName ??
        selectedAssignment.Section?.sectionName ??
        selectedAssignment.section?.SectionName ??
        selectedAssignment.section?.sectionName ??
        "Section"
      }`
    : "No assignment selected";

  const submit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !form.Title.trim() ||
      !form.ExamTypeId  ||
      !form.TotalMarks ||
      !form.ExamDate ||
      !form.TeacherSectionCourseId
    ) {
      notify(
        "error",
        "Validation failed",
        "Complete all exam fields."
      );
      return;
    }

    setSubmitting(true);

    try {
      await createExam({
        Title: form.Title.trim(),
          ExamTypeId: form.ExamTypeId,
        TotalMarks: Number(form.TotalMarks),
        IsPublished: form.IsPublished,
        ExamDate: form.ExamDate,
        TeacherSectionCourseId:
          form.TeacherSectionCourseId,
      });

      notify(
        "success",
        "Exam created",
        "The exam was created successfully."
      );

      router.push("/teacher");
    } catch (error) {
      notify(
        "error",
        "Exam creation failed",
        error instanceof ApiError
          ? error.message
          : "Unable to create exam."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Teacher", "HOD"]}>
      <AppShell>
        <PageHeader
          title="Create exam"
          description="Create an exam for one of your assigned courses."
        />

        <Card className="max-w-2xl">
          <form
            className="space-y-6"
            onSubmit={submit}
            noValidate
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Title"
                value={form.Title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    Title: event.target.value,
                  }))
                }
              />

              <Select
  label="Exam type"
  value={form.ExamTypeId}
  onChange={(event) =>
    setForm((current) => ({
      ...current,
      ExamTypeId: event.target.value,
    }))
  }
>
  <option value="">Select exam type</option>

  {examTypes.map((examType) => (
    <option
      key={examType.examTypeId}
      value={examType.examTypeId}
    >
      {examType.type}
    </option>
  ))}
</Select>

              <Input
                label="Total marks"
                type="number"
                min="1"
                value={form.TotalMarks}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    TotalMarks: event.target.value,
                  }))
                }
              />

              <Input
                label="Exam date"
                type="date"
                value={form.ExamDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ExamDate: event.target.value,
                  }))
                }
              />

              {fromAssignmentCard ? (
                <div className="rounded-xl border border-black/10 theme-bg-page px-3 py-2.5 text-sm theme-text">
                  <span className="mb-1 block theme-text-muted">
                    Assigned course and section
                  </span>

                  {assignmentLabel}
                </div>
              ) : (
                <Select
                  label="Assigned course and section"
                  value={form.TeacherSectionCourseId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      TeacherSectionCourseId:
                        event.target.value,
                    }))
                  }
                >
                  <option value="">
                    Select assignment
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
                      {assignment.Section?.SectionName ??
                        assignment.Section?.sectionName ??
                        assignment.section?.SectionName ??
                        assignment.section?.sectionName ??
                        "Section"}
                    </option>
                  ))}
                </Select>
              )}

              <label className="flex items-center gap-3 text-sm theme-text-soft">
                <input
                  type="checkbox"
                  checked={form.IsPublished}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      IsPublished:
                        event.target.checked,
                    }))
                  }
                />

                Publish immediately
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={submitting}
              >
                {submitting
                  ? "Creating..."
                  : "Create exam"}
              </Button>
            </div>
          </form>
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}





