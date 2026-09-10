"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";

import {
  listResultsByExamId,
  updateBulkStudentResults,
  uploadBulkStudentResults,
  listStudentsBySectionId,
  type SectionStudent,
} from "@/src/lib/api/exams.api";

import { ApiError } from "@/src/lib/api/client";

type StudentResultForm = {
  examResultId?: string;
  obtainMarks: string;
  isAbsent: boolean;
  remarks: string;
};

export default function UploadExamResultsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const { notify } = useNotifications();

  const examId = String(params.examId ?? "");
  const sectionId = searchParams.get("sectionId") ?? "";

  const totalMarks = Number(
    searchParams.get("totalMarks") ?? "0"
  );

  const [students, setStudents] = useState<
    SectionStudent[]
  >([]);

  const [results, setResults] = useState<
    Record<string, StudentResultForm>
  >({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /*
   * Load students when this page opens.
   */
  useEffect(() => {
    if (!sectionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);

      notify(
        "error",
        "Section unavailable",
        "The section ID was not provided."
      );

      return;
    }

    const loadStudents = async () => {
      try {
        setLoading(true);

        const data = await listStudentsBySectionId(sectionId);
        const existingResults = await listResultsByExamId(examId).catch(
          () => [],
        );
        const existingByStudent = new Map(existingResults.map((result) => [result.studentId, result]));

        setStudents(data);

        /*
         * Default every student to:
         * - Obtain marks = empty
         * - Absent = false
         * - Remarks = empty
         */
        const initialResults: Record<
          string,
          StudentResultForm
        > = {};

        data.forEach((student) => {
          initialResults[student.studentId] = {
            examResultId: existingByStudent.get(student.studentId)?.examResultId,
            obtainMarks: existingByStudent.get(student.studentId)?.obtainMarks?.toString() ?? "",
            isAbsent: existingByStudent.get(student.studentId)?.isAbsent ?? false,
            remarks: existingByStudent.get(student.studentId)?.remarks ?? "",
          };
        });

        setResults(initialResults);
      } catch (error) {
        console.error(
          "Failed to load section students:",
          error
        );

        notify(
          "error",
          "Students unavailable",
          error instanceof ApiError
            ? error.message ||
            "Unable to load students."
            : "Unable to load students."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadStudents();
  }, [examId, notify, sectionId]);

  /*
   * Update one student's result field.
   */
  const updateStudentResult = (
    studentId: string,
    changes: Partial<StudentResultForm>
  ) => {
    setResults((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        ...changes,
      },
    }));
  };

  /*
   * Basic validation before submitting.
   */
  const validationError = useMemo(() => {
    if (!examId) {
      return "Exam ID is missing.";
    }

    if (!sectionId) {
      return "Section ID is missing.";
    }

    if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
      return "Total marks are invalid.";
    }

    for (const student of students) {
      const result = results[student.studentId];

      if (!result) {
        continue;
      }

      /*
       * Absent students don't need obtain marks.
       */
      if (result.isAbsent) {
        continue;
      }

      if (result.obtainMarks.trim() === "") {
        return `Enter obtain marks for ${student.fullName}.`;
      }

      const marks = Number(result.obtainMarks);

      if (!Number.isFinite(marks)) {
        return `Obtain marks for ${student.fullName} must be a number.`;
      }

      if (marks < 0) {
        return `Obtain marks for ${student.fullName} cannot be negative.`;
      }

      if (marks > totalMarks) {
        return `${student.fullName} cannot have more than ${totalMarks} marks.`;
      }
    }

    return null;
  }, [
    examId,
    sectionId,
    totalMarks,
    students,
    results,
  ]);

  /*
   * Submit all student results.
   */
  const submitResults = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (validationError) {
      notify(
        "error",
        "Validation failed",
        validationError
      );

      return;
    }

    setSubmitting(true);

    try {
      /*
       * Use bulk upload for a first submission and bulk update
       * when this exam already has saved results.
       */
      const payload = students.map((student) => {
        const result = results[student.studentId];
        let obtainMarks: number | null = null;
        if (result && !result.isAbsent) {
          const trimmed = result.obtainMarks.trim();
          obtainMarks = trimmed === "" ? null : Number(trimmed);
        }
        return {
          examId,
          studentId: student.studentId,
          obtainMarks,
          isAbsent: result?.isAbsent ?? false,
          remarks: result?.remarks.trim() || "",
        };
      });
      const existingCount = students.filter((student) => Boolean(results[student.studentId]?.examResultId)).length;
      if (existingCount === 0) {
        await uploadBulkStudentResults(payload);
      } else if (existingCount !== students.length) {
        throw new Error("Some students do not have an existing result. Bulk update requires an existing result for every student in the exam.");
      } else {
        await updateBulkStudentResults(payload);
      }

      notify(
        "success",
        "Results uploaded",
        "Student results were saved successfully."
      );

      router.back();
    } catch (error) {
      console.error(
        "Failed to upload student results:",
        error
      );

      notify(
        "error",
        "Result upload failed",
        error instanceof ApiError
          ? error.message ||
          "Unable to save student results."
          : "Unable to save student results."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Teacher", "HOD"]}>
      <AppShell>
        <PageHeader
          title="Upload Result"
          description="Enter the marks obtained by each student in this exam."
        />

        <Card>
          {/* EXAM INFORMATION */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h2 className="text-lg font-semibold">
                Student Results
              </h2>

              <p className="mt-1 text-sm text-[#888888]">
                Total marks:{" "}
                <span className="text-white">
                  {totalMarks}
                </span>
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Back
            </Button>
          </div>

          {loading ? (
            <p className="py-10 text-sm text-[#888888]">
              Loading students...
            </p>
          ) : students.length === 0 ? (
            <p className="py-10 text-sm text-[#888888]">
              No students were found in this section.
            </p>
          ) : (
            <form
              onSubmit={submitResults}
              className="space-y-6"
            >
              {/* STUDENT TABLE */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-[#888888]">
                        Student
                      </th>

                      <th className="px-4 py-3 text-[#888888]">
                        Total Marks
                      </th>

                      <th className="px-4 py-3 text-[#888888]">
                        Obtain Marks
                      </th>

                      <th className="px-4 py-3 text-[#888888]">
                        Absent
                      </th>

                      <th className="px-4 py-3 text-[#888888]">
                        Remarks
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map((student) => {
                      const result =
                        results[student.studentId] ?? {
                          obtainMarks: "",
                          isAbsent: false,
                          remarks: "",
                        };

                      return (
                        <tr
                          key={student.studentId}
                          className="border-b border-white/5"
                        >
                          {/* STUDENT */}
                          <td className="px-4 py-4 font-medium">
                            {student.fullName}
                          </td>

                          {/* TOTAL MARKS */}
                          <td className="px-4 py-4">
                            <span className="font-medium">
                              {totalMarks}
                            </span>
                          </td>

                          {/* OBTAIN MARKS */}
                          <td className="px-4 py-4">
                            <Input
                              type="number"
                              min="0"
                              max={totalMarks}
                              step="0.01"
                              value={result.obtainMarks}
                              disabled={result.isAbsent}
                              onChange={(event) =>
                                updateStudentResult(
                                  student.studentId,
                                  {
                                    obtainMarks:
                                      event.target
                                        .value,
                                  }
                                )
                              }
                              placeholder="0"
                              aria-label={`Obtain marks for ${student.fullName}`}
                            />
                          </td>

                          {/* ABSENT */}
                          <td className="px-4 py-4">
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={
                                  result.isAbsent
                                }
                                onChange={(event) =>
                                  updateStudentResult(
                                    student.studentId,
                                    {
                                      isAbsent:
                                        event.target
                                          .checked,
                                      obtainMarks:
                                        event.target
                                          .checked
                                          ? "0"
                                          : result.obtainMarks,
                                    }
                                  )
                                }
                                className="h-4 w-4"
                              />

                              <span className="text-sm">
                                Absent
                              </span>
                            </label>
                          </td>

                          {/* REMARKS */}
                          <td className="px-4 py-4">
                            <Input
                              value={result.remarks}
                              onChange={(event) =>
                                updateStudentResult(
                                  student.studentId,
                                  {
                                    remarks:
                                      event.target
                                        .value,
                                  }
                                )
                              }
                              placeholder="Optional"
                              aria-label={`Remarks for ${student.fullName}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* SUBMIT */}
              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  loading={submitting}
                  disabled={submitting}
                >
                  {submitting
                    ? "Uploading..."
                    : "Save Results"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}