"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import {
  getStudentAttendance,
  listStudentAttendanceCourses,
} from "@/src/lib/api/attendance.api";
import type { Attendance, AttendanceStatus, StudentAttendanceCourse } from "@/src/lib/types";

const statusTone: Record<AttendanceStatus, "success" | "danger" | "warning" | "info"> = {
  Present: "success",
  Absent: "danger",
  Late: "warning",
  Leave: "info",
};

const formatDate = (value: string) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

export default function StudentPage() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [courses, setCourses] = useState<StudentAttendanceCourse[]>([]);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [courseId, setCourseId] = useState("");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!user?.Id) {
      return;
    }

    const loadCourses = async () => {
      try {
        const courseData = await listStudentAttendanceCourses(user.Id);
        setCourses(courseData);
        setCourseId((current) => current || courseData[0]?.CourseId || "");
      } catch (error) {
        notify(
          "error",
          "Attendance unavailable",
          error instanceof ApiError ? error.message : "Unable to load your courses.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCourses();
  }, [notify, user?.Id]);

  useEffect(() => {
    if (!user?.Id || !from || !to) return;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        setRecords(await getStudentAttendance(user.Id, { courseId, from, to }));
      } catch (error) {
        setRecords([]);
        notify(
          "error",
          "History unavailable",
          error instanceof ApiError ? error.message : "Unable to load attendance history.",
        );
      } finally {
        setLoadingHistory(false);
      }
    };

    void loadHistory();
  }, [courseId, from, notify, to, user?.Id]);

  const summary = useMemo(() => {
    const present = records.filter((record) => record.Status === "Present").length;
    const late = records.filter((record) => record.Status === "Late").length;
    const absent = records.filter((record) => record.Status === "Absent").length;
    const leave = records.filter((record) => record.Status === "Leave").length;
    const total = records.length;

    return {
      total,
      present,
      absent,
      late,
      leave,
      percentage: total ? Math.round(((present + late) / total) * 100) : 0,
    };
  }, [records]);

  const selectedCourse = courses.find((course) => course.CourseId === courseId);

  return (
    <ProtectedRoute allowedRoles={["Student"]}>
      <AppShell>
        <PageHeader
          title="Attendance history"
          description="Review your attendance record by course and date range."
        />

        <div className="space-y-5">
          <Card>
            <div className="grid gap-4 md:grid-cols-3">
              <Select
                label="Course"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                disabled={loading || courses.length === 0}
              >
                <option value="">
                  {loading ? "Loading courses..." : "All courses"}
                </option>
                {courses.map((course) => (
                  <option key={course.CourseId} value={course.CourseId}>
                    {course.CourseName ?? "Course"} - {course.SectionName ?? "Section"}
                  </option>
                ))}
              </Select>
              <Input label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              <Input label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Attendance", `${summary.percentage}%`],
              ["Sessions", summary.total],
              ["Present", summary.present],
              ["Late", summary.late],
              ["Absent / Leave", summary.absent + summary.leave],
            ].map(([label, value]) => (
              <Card key={label as string} className="p-4">
                <p className="text-xs uppercase tracking-widest theme-text-muted">{label}</p>
                <p className="mt-2 text-2xl font-semibold theme-text">{value}</p>
                {label === "Attendance" ? <p className="mt-1 text-xs theme-text-muted">Present and late count</p> : null}
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-5">
              <div>
                <h2 className="text-lg font-semibold theme-text">Daily record</h2>
                <p className="mt-1 text-sm theme-text-muted">
                  {selectedCourse?.CourseName ?? "All enrolled courses"} Â· {from} to {to}
                </p>
              </div>
              <Badge tone={loadingHistory ? "default" : summary.percentage >= 75 ? "success" : "danger"}>
                {loadingHistory ? "Loading" : `${summary.percentage}% attendance`}
              </Badge>
            </div>

            {loadingHistory ? (
              <p className="p-8 text-sm theme-text-muted">Loading attendance history...</p>
            ) : records.length === 0 ? (
              <p className="p-8 text-sm theme-text-muted">No attendance records were found for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-black/10 theme-text-muted">
                    <tr>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Course</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.AttendanceId || `${record.AttendanceDate}-${record.TeacherSectionCourseId}`} className="border-b border-black/5 last:border-0">
                        <td className="px-5 py-4 theme-text">{formatDate(record.AttendanceDate)}</td>
                        <td className="px-5 py-4 theme-text-soft">{record.CourseName ?? "Course"}</td>
                        <td className="px-5 py-4"><Badge tone={statusTone[record.Status]}>{record.Status}</Badge></td>
                        <td className="px-5 py-4 theme-text-muted">{record.Remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}






