"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  getCourseAttendance,
  updateAttendance,
} from "@/src/lib/api/attendance.api";
import { listStudentsBySectionId } from "@/src/lib/api/exams.api";
import {
  listTeacherSectionCoursesByTeacherId,
} from "@/src/lib/api/teacher-section-course.api";
import { listTeachers } from "@/src/lib/api/teachers.api";
import { getTeacherEntityId } from "@/src/lib/utils/teacher";
import type { SectionStudent } from "@/src/lib/api/exams.api";
import type {
  AttendanceStatus,
  TeacherSectionCourse,
} from "@/src/lib/types";

const statuses: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Leave",
];

const statusLabels: Record<AttendanceStatus, string> = {
  Present: "P",
  Absent: "A",
  Late: "LA",
  Leave: "LE",
};

const getId = (student: SectionStudent) =>
  student.enrollmentId ??
  student.EnrollmentId ??
  student.studentEnrollmentId ??
  student.StudentEnrollmentId ??
  "";

const getName = (student: SectionStudent) =>
  student.fullName ?? student.FullName ?? "Unnamed student";

const getAttendanceId = (record: { AttendanceId?: string }) =>
  record.AttendanceId ?? "";

const getAttendanceStatus = (status: unknown): AttendanceStatus => {
  if (typeof status === "number") {
    return statuses[status] ?? "Present";
  }

  return statuses.includes(status as AttendanceStatus)
    ? (status as AttendanceStatus)
    : "Present";
};

const getAssignmentId = (
  assignment: TeacherSectionCourse
) =>
  assignment.TeacherSectionCourseId ??
  assignment.teacherSectionCourseId ??
  "";

const getCellKey = (date: string, enrollmentId: string) =>
  `${date}:${enrollmentId}`;

const getMonthDates = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${year}-${String(month + 1).padStart(2, "0")}-${day}`;
  });
};

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [assignments, setAssignments] = useState<
    TeacherSectionCourse[]
  >([]);

  const [students, setStudents] = useState<SectionStudent[]>([]);
  const [assignmentId, setAssignmentId] = useState("");

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [statusByCell, setStatusByCell] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [remarksByCell, setRemarksByCell] = useState<Record<string, string>>(
    {},
  );
  const [attendanceIdsByCell, setAttendanceIdsByCell] = useState<
    Record<string, string>
  >({});
  const [dirtyCells, setDirtyCells] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const attendanceRequestId = useRef(0);
  const matrixScrollRef = useRef<HTMLDivElement>(null);
  const preparedDateRef = useRef<string | null>(null);
  const [editingRemarkCell, setEditingRemarkCell] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const monthDates = useMemo(
    () => getMonthDates(selectedYear, selectedMonth),
    [selectedMonth, selectedYear],
  );
  const visibleDates = useMemo(
    () => monthDates.filter((date) => {
      if (includeWeekends) return true;
      const day = new Date(`${date}T12:00:00`).getDay();
      return day !== 0 && day !== 6;
    }),
    [includeWeekends, monthDates],
  );
  const todayIso = new Date().toISOString().slice(0, 10);
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(selectedYear, selectedMonth, 1));
  const activeDate = visibleDates.includes(selectedDate)
    ? selectedDate
    : visibleDates.find((date) => date <= todayIso) ?? visibleDates[0] ?? "";

  useEffect(() => {
    if (!matrixScrollRef.current || !monthDates.includes(todayIso)) return;

    requestAnimationFrame(() => {
      const container = matrixScrollRef.current;
      const target = container?.querySelector<HTMLElement>(
        `[data-date="${todayIso}"]`,
      );

      if (container && target) {
        container.scrollLeft = Math.max(0, target.offsetLeft - 176);
      }
    });
  }, [monthDates, todayIso]);

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
        const assignmentData =
          await listTeacherSectionCoursesByTeacherId(teacherId);

        setAssignments(assignmentData);

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

  useEffect(() => {
    if (!sectionId) {
      return;
    }

    const loadSectionRoster = async () => {
      try {
        const sectionStudents = await listStudentsBySectionId(sectionId);
        setStudents(sectionStudents);
      } catch {
        setStudents([]);
      }
    };

    void loadSectionRoster();
  }, [sectionId]);

  useEffect(() => {
    if (!assignmentId) return;

    const loadMonthlyAttendance = async () => {
      const requestId = ++attendanceRequestId.current;
      preparedDateRef.current = null;
      setLoadingAttendance(true);
      setStatusByCell({});
      setRemarksByCell({});
      setAttendanceIdsByCell({});
      setDirtyCells(new Set());

      try {
        const results = await Promise.allSettled(
          visibleDates.map((date) => getCourseAttendance(assignmentId, date)),
        );

        if (requestId !== attendanceRequestId.current) return;

        const nextStatuses: Record<string, AttendanceStatus> = {};
        const nextRemarks: Record<string, string> = {};
        const nextAttendanceIds: Record<string, string> = {};
        let failedDays = 0;

        results.forEach((result, index) => {
          if (result.status === "rejected") {
            if (!(result.reason instanceof ApiError && result.reason.status === 404)) {
              failedDays += 1;
            }
            return;
          }

          result.value.forEach((record) => {
            const enrollmentId = record.StudentEnrollmentId;
            if (!enrollmentId) return;

            const date = visibleDates[index];
            const key = getCellKey(date, enrollmentId);
            nextStatuses[key] = getAttendanceStatus(record.Status);
            nextRemarks[key] = record.Remarks ?? "";
            nextAttendanceIds[key] = getAttendanceId(record);
          });
        });

        setStatusByCell(nextStatuses);
        setRemarksByCell(nextRemarks);
        setAttendanceIdsByCell(nextAttendanceIds);

        if (failedDays > 0) {
          notify(
            "error",
            "Some dates could not load",
            `${failedDays} day${failedDays === 1 ? " was" : "s were"} unavailable. You can still edit the loaded dates.`,
          );
        }
      } finally {
        if (requestId === attendanceRequestId.current) {
          setLoadingAttendance(false);
        }
      }
    };

    void loadMonthlyAttendance();
  }, [assignmentId, notify, reloadToken, visibleDates]);

  useEffect(() => {
    if (!activeDate || activeDate > todayIso || loadingAttendance || students.length === 0) return;
    if (preparedDateRef.current === activeDate) return;

    preparedDateRef.current = activeDate;
    setStatusByCell((current) => {
      const next = { ...current };
      students.forEach((student) => {
        const key = getCellKey(activeDate, getId(student));
        if (!next[key]) next[key] = "Present";
      });
      return next;
    });
    setDirtyCells((current) => {
      const next = new Set(current);
      students.forEach((student) => {
        const key = getCellKey(activeDate, getId(student));
        if (!attendanceIdsByCell[key]) next.add(key);
      });
      return next;
    });
  }, [activeDate, attendanceIdsByCell, loadingAttendance, students, todayIso]);

  const sectionStudents = useMemo(() => students, [students]);

  const submit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!assignmentId) {
      notify(
        "error",
        "Validation failed",
        "Select a course and section first."
      );
      return;
    }

    if (dirtyCells.size === 0) {
      notify(
        "error",
        "Validation failed",
        "Change at least one attendance cell before saving."
      );
      return;
    }

    setSubmitting(true);

    try {
      const bulkByDate: Record<string, { StudentEnrollmentId: string; Status: AttendanceStatus; Remarks?: string }[]> = {};
      const updates: Promise<unknown>[] = [];

      dirtyCells.forEach((key) => {
        const separatorIndex = key.indexOf(":");
        const date = key.slice(0, separatorIndex);
        const enrollmentId = key.slice(separatorIndex + 1);
        const status = statusByCell[key];
        if (!status || date > todayIso || date !== activeDate) return;

        const entry = {
          StudentEnrollmentId: enrollmentId,
          Status: status,
          Remarks: remarksByCell[key] || undefined,
        };
        const attendanceId = attendanceIdsByCell[key];

        if (attendanceId) {
          updates.push(updateAttendance(attendanceId, entry));
        } else {
          bulkByDate[date] ??= [];
          bulkByDate[date].push(entry);
        }
      });

      const bulkResults = await Promise.all(
        Object.entries(bulkByDate).map(([date, entries]) =>
          markBulkAttendance({
            TeacherSectionCourseId: assignmentId,
            AttendanceDate: `${date}T00:00:00`,
            Entries: entries,
          }),
        ),
      );
      await Promise.all(updates);

      const skipped = bulkResults.reduce(
        (total, result) => total + (result.RecordsSkipped ?? 0),
        0,
      );
      if (skipped > 0) {
        throw new Error("Some attendance records were skipped. Verify the section enrollment IDs.");
      }

      setDirtyCells(new Set());
      setReloadToken((current) => current + 1);

      notify(
        "success",
        "Attendance saved",
        "The monthly attendance changes were saved."
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
          title="Attendance"
          description="Record, review, and update attendance by course, section, and date."
        />

        <Card className="rounded-xl p-3 sm:p-4">
          <form
            className="space-y-4"
            onSubmit={submit}
          >
            <div className="grid gap-3 md:grid-cols-3">
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

              <Select
                label="Month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                disabled={loadingAttendance || submitting}
              >
                {Array.from({ length: 12 }, (_, month) => (
                  <option key={month} value={month}>
                    {new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2024, month, 1))}
                  </option>
                ))}
              </Select>

              <Select
                label="Year"
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                disabled={loadingAttendance || submitting}
              >
                {Array.from({ length: 5 }, (_, index) => {
                  const year = today.getFullYear() - 2 + index;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </Select>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="w-48">
                <Select
                  label="Active date"
                  value={activeDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  disabled={loadingAttendance || submitting || visibleDates.length === 0}
                >
                  {visibleDates.map((date) => {
                    const day = new Date(`${date}T12:00:00`);
                    return <option key={date} value={date}>{day.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</option>;
                  })}
                </Select>
              </div>
              <label className="flex min-h-10 items-center gap-2 pb-2 text-sm theme-text-soft">
                <input
                  type="checkbox"
                  checked={includeWeekends}
                  onChange={(event) => setIncludeWeekends(event.target.checked)}
                  disabled={loadingAttendance || submitting}
                  className="theme-accent h-4 w-4"
                />
                Include weekends
              </label>
              <Button
                type="submit"
                loading={submitting || loadingAttendance}
                disabled={loadingAttendance}
                className="mb-0.5 rounded-lg px-3 py-2 text-sm"
              >
                {submitting ? "Saving..." : "Save attendance"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-sm">
              <div>
                <p className="font-medium theme-text">
                  {loadingAttendance
                    ? `Loading ${monthLabel}...`
                    : `${monthLabel} attendance`}
                </p>
                <p className="mt-1 text-xs theme-text-muted">
                  Choose a status in any day column, add a remark, then save the changed cells.
                </p>
              </div>
              <span className="theme-text-muted">
                {dirtyCells.size} unsaved change{dirtyCells.size === 1 ? "" : "s"}
              </span>
            </div>

            {sectionStudents.length === 0 ? (
              <p className="py-8 text-sm theme-text-muted">
                No students with enrollment records were found
                for this section.
              </p>
            ) : (
              <div ref={matrixScrollRef} className="isolate max-h-screen min-w-0 overflow-auto rounded-lg border border-black/10">
                <table className="min-w-max border-separate border-spacing-0 text-left text-xs">
                  <thead className="border-b border-black/10">
                    <tr>
                      <th scope="col" className="sticky left-0 top-0 z-40 w-44 min-w-44 max-w-44 border-b border-r border-black/10 theme-bg-surface px-3 py-2 text-left text-xs uppercase tracking-wide theme-text-muted shadow-lg">
                        Students
                      </th>
                      {visibleDates.map((date) => {
                        const day = new Date(`${date}T12:00:00`);
                        const isToday = date === todayIso;
                        const isFuture = date > todayIso;
                        return (
                          <th
                            key={date}
                            data-date={date}
                            className={`sticky top-0 z-30 min-w-16 border-b border-l border-black/10 theme-bg-surface px-1 py-2 text-center ${isToday ? "theme-bg-primary-soft" : ""} ${isFuture || date !== activeDate ? "opacity-40" : ""}`}
                          >
                            <span className="block font-semibold theme-text">{day.getDate()}</span>
                            <span className="block text-xs uppercase tracking-wide theme-text-muted">
                              {new Intl.DateTimeFormat("en", { weekday: "short" }).format(day)}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {sectionStudents.map((student) => {
                      const id = getId(student);

                      return (
                        <tr
                          key={id}
                          className="border-b border-black/5"
                        >
                          <td
                            scope="row"
                            className="sticky left-0 z-20 w-44 min-w-44 max-w-44 border-b border-r border-black/5 theme-bg-surface px-3 py-2 shadow-lg"
                          >
                            <span className="block truncate font-medium theme-text" title={getName(student)}>
                              {getName(student)}
                            </span>
                          </td>
                          {visibleDates.map((date) => {
                            const key = getCellKey(date, id);
                            const isFuture = date > todayIso;
                            const isActiveDate = date === activeDate;
                            return (
                              <td
                                key={key}
                                tabIndex={isFuture || !isActiveDate ? -1 : 0}
                                onDoubleClick={() => {
                                  if (!isFuture && isActiveDate) setEditingRemarkCell(key);
                                }}
                                onKeyDown={(event) => {
                                  if ((event.key === "Enter" || event.key === " ") && !isFuture && isActiveDate) {
                                    event.preventDefault();
                                    setEditingRemarkCell(key);
                                  }
                                }}
                                title="Double-click or press Enter to edit remark"
                                className={`min-w-16 border-b border-l border-black/10 px-0.5 py-1 align-top ${date === todayIso ? "theme-bg-primary-tint" : ""} ${!isActiveDate ? "theme-bg-page-muted" : ""}`}
                              >
                                <Select
                                  aria-label={`${getName(student)} status for ${date}`}
                                  value={statusByCell[key] ?? ""}
                                  disabled={loadingAttendance || submitting || isFuture || !isActiveDate}
                                  className="w-14 rounded-md px-0.5 py-1 text-xs"
                                  onChange={(event) => {
                                    const value = event.target.value as AttendanceStatus;
                                    setStatusByCell((current) => ({ ...current, [key]: value }));
                                    setDirtyCells((current) => new Set(current).add(key));
                                  }}
                                >
                                  <option value="">-</option>
                                  {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                                </Select>
                                {editingRemarkCell === key ? (
                                  <Input
                                    aria-label={`${getName(student)} remark for ${date}`}
                                    autoFocus
                                    value={remarksByCell[key] ?? ""}
                                    disabled={loadingAttendance || submitting || isFuture || !isActiveDate}
                                    className="mt-1 w-28 rounded-md px-1.5 py-1 text-xs"
                                    onBlur={() => setEditingRemarkCell(null)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === "Escape") {
                                        event.preventDefault();
                                        setEditingRemarkCell(null);
                                      }
                                    }}
                                    onChange={(event) => {
                                      setRemarksByCell((current) => ({ ...current, [key]: event.target.value }));
                                      setDirtyCells((current) => new Set(current).add(key));
                                    }}
                                    placeholder="Remark"
                                  />
                                ) : (
                                  <span className="mt-1 block min-h-5 w-28 truncate px-1 text-xs theme-text-muted">
                                    {remarksByCell[key] || (isActiveDate ? "Double-click for remark" : "")}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </form>
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}





