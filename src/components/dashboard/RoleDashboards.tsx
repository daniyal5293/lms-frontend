"use client";

import { useEffect, useState } from "react";
import {
  BarList,
  ChartCard,
  ColumnChart,
  EmptyChart,
  Legend,
  PercentLine,
  StackedBar,
  StatTile,
  chartColors,
  type Segment,
} from "@/src/components/charts/Charts";
import { Card } from "@/src/components/ui/Card";
import { ApiError } from "@/src/lib/api/client";
import {
  getAdminDashboard,
  getHodDashboard,
  getTeacherDashboard,
  type AdminDashboard as AdminData,
  type AttendanceSummary,
  type AttendanceWeek,
  type HodDashboard as HodData,
  type TeacherDashboard as TeacherData,
} from "@/src/lib/api/dashboard.api";
import { formatSectionText } from "@/src/lib/utils";

const percent = (value: number) => `${value}%`;
const percentOrDash = (value: number | null) => (value === null ? "–" : percent(value));

function useDashboard<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    load()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof ApiError ? reason.message : "Unable to load the dashboard.");
      });
    return () => {
      active = false;
    };
  }, [load]);

  return { data, error };
}

function DashboardState({ error }: { error: string }) {
  return <Card className="text-sm theme-text-muted">{error || "Loading dashboard..."}</Card>;
}

const attendanceSegments = (summary: AttendanceSummary): Segment[] => [
  { label: "Present", value: summary.present, color: chartColors.present },
  { label: "Late", value: summary.late, color: chartColors.late },
  { label: "Leave", value: summary.leave, color: chartColors.leave },
  { label: "Absent", value: summary.absent, color: chartColors.absent },
];

function AttendanceTrend({ weeks }: { weeks: AttendanceWeek[] }) {
  return (
    <ChartCard
      title="Attendance trend"
      subtitle="Weekly attendance rate, last 12 weeks"
      table={{ head: ["Week of", "Rate", "Marked"], rows: weeks.map((week) => [week.label, percent(week.rate), week.marked]) }}
    >
      {weeks.length >= 2 ? (
        <PercentLine seriesLabel="Attendance rate" points={weeks.map((week) => ({ label: week.label, value: week.rate, note: `${week.marked} marked` }))} />
      ) : (
        <EmptyChart
          message={
            weeks.length === 1
              ? `Only one week has attendance so far (${percent(weeks[0].rate)} in the week of ${weeks[0].label}). The trend appears after two weeks.`
              : "No attendance marked in the last 12 weeks."
          }
        />
      )}
    </ChartCard>
  );
}

export function AdminDashboard() {
  const { data, error } = useDashboard<AdminData>(getAdminDashboard);
  if (!data) return <DashboardState error={error} />;

  const { attendance, fees } = data;
  const notYetDue = Math.max(fees.outstanding - fees.overdue, 0);
  const money = (value: number | string) => `${fees.currency} ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const feeSegments: Segment[] = [
    { label: "Collected", value: fees.collected, color: chartColors.present },
    { label: "Not yet due", value: notYetDue, color: chartColors.late },
    { label: "Overdue", value: fees.overdue, color: chartColors.absent },
  ];
  const departments = [...data.departments].sort((a, b) => b.students - a.students);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Students" value={data.activeStudents} hint={`${data.totalStudents} on record`} />
        <StatTile label="Teachers" value={data.teachers} hint="Active" />
        <StatTile label="Sections" value={data.sections} hint="Active" />
        <StatTile label="Courses" value={data.courses} />
        <StatTile label="Attendance" value={percentOrDash(attendance.rate)} hint={`${attendance.total} records`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Enrolment" subtitle="Active students by cohort">
          {data.enrolmentByCohort.length > 0 ? <BarList rows={data.enrolmentByCohort} /> : <EmptyChart message="No active students yet." />}
        </ChartCard>

        <ChartCard title="Departments" subtitle="Active students and teachers">
          {departments.length > 0 ? (
            <BarList rows={departments.map((department) => ({ label: department.name, value: department.students, note: `${department.teachers} teachers` }))} />
          ) : (
            <EmptyChart message="No departments yet." />
          )}
        </ChartCard>

        <ChartCard title="Fee collection" subtitle={`${fees.invoices} invoices in ${fees.currency}, all time${fees.otherCurrencyInvoices ? `. ${fees.otherCurrencyInvoices} in other currencies not shown` : ""}`}>
          {fees.billed > 0 ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4">
                {[
                  ["Billed", fees.billed],
                  ["Collected", fees.collected],
                  ["Outstanding", fees.outstanding],
                  ["Overdue", fees.overdue],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="theme-text-muted">{label}</p>
                    <p className="text-sm font-semibold theme-text">{money(value)}</p>
                  </div>
                ))}
              </div>
              <StackedBar segments={feeSegments} format={money} />
              <Legend segments={feeSegments} />
              {fees.months.length >= 2 ? (
                <ColumnChart
                  format={money}
                  rows={fees.months.map((month) => ({
                    label: month.label,
                    segments: [
                      { label: "Collected", value: Math.min(month.collected, month.billed), color: chartColors.present },
                      { label: "Unpaid", value: Math.max(month.billed - month.collected, 0), color: chartColors.late },
                    ],
                  }))}
                />
              ) : null}
            </div>
          ) : (
            <EmptyChart message="No invoices have been generated yet." />
          )}
        </ChartCard>

        <ChartCard title="Attendance overview" subtitle="All classes, all time">
          {attendance.total > 0 ? (
            <div className="space-y-2.5">
              <StackedBar segments={attendanceSegments(attendance)} />
              <Legend segments={attendanceSegments(attendance)} format={String} />
            </div>
          ) : (
            <EmptyChart message="No attendance has been marked yet." />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

export function HodDashboard() {
  const { data, error } = useDashboard<HodData>(getHodDashboard);
  if (!data) return <DashboardState error={error} />;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Students" value={data.students} hint={data.department} />
        <StatTile label="Teachers" value={data.teachers} hint={data.department} />
        <StatTile label="Sections" value={data.sections} />
        <StatTile label="Attendance" value={percentOrDash(data.attendanceRate)} />
        <StatTile label="Average score" value={percentOrDash(data.averageScore)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Students by section" subtitle="Active enrolments">
          {data.studentsBySection.length > 0 ? (
            <BarList rows={data.studentsBySection.map((section) => ({ ...section, label: formatSectionText(section.label) }))} />
          ) : (
            <EmptyChart message="No students are enrolled in this department yet." />
          )}
        </ChartCard>

        <div className="space-y-3">
          <AttendanceTrend weeks={data.attendanceTrend} />
          <ChartCard title="Academic performance" subtitle="Average score by course">
            {data.coursePerformance.length > 0 ? (
              <BarList max={100} format={percent} rows={data.coursePerformance.map((course) => ({ label: course.label, value: course.average, note: `${course.results} results` }))} />
            ) : (
              <EmptyChart message="No exam results have been entered yet." />
            )}
          </ChartCard>
        </div>

        <ChartCard title="Teacher performance" subtitle="Exams set, results entered, average score and attendance in their classes" className="lg:col-span-2">
          {data.teacherPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left theme-text-muted">
                    <th className="px-2 py-1 font-medium">Teacher</th>
                    <th className="px-2 py-1 text-right font-medium">Exams</th>
                    <th className="px-2 py-1 text-right font-medium">Results</th>
                    <th className="px-2 py-1 text-right font-medium">Avg score</th>
                    <th className="px-2 py-1 text-right font-medium">Attendance</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums theme-text-soft">
                  {data.teacherPerformance.map((teacher) => (
                    <tr key={teacher.name} className="border-t border-black/5">
                      <td className="px-2 py-1 theme-text">{teacher.name}</td>
                      <td className="px-2 py-1 text-right">{teacher.exams}</td>
                      <td className="px-2 py-1 text-right">{teacher.results}</td>
                      <td className="px-2 py-1 text-right">{percentOrDash(teacher.averageScore)}</td>
                      <td className="px-2 py-1 text-right">{percentOrDash(teacher.attendanceRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyChart message="No active teachers in this department." />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

export function TeacherDashboard() {
  const { data, error } = useDashboard<TeacherData>(getTeacherDashboard);
  if (!data) return <DashboardState error={error} />;

  const hasScores = data.scoreBands.some((band) => band.value > 0);
  const legendSegments = data.attendanceBySection[0] ? attendanceSegments(data.attendanceBySection[0]) : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Sections" value={data.sections} />
        <StatTile label="Students" value={data.students} />
        <StatTile label="Exams" value={data.exams} />
        <StatTile label="Awaiting results" value={data.examsAwaitingResults} hint="Past exams with no marks" />
        <StatTile label="Attendance" value={percentOrDash(data.attendanceRate)} />
        <StatTile label="Average score" value={percentOrDash(data.averageScore)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Class attendance" subtitle="By section, all time">
          {data.attendanceBySection.length > 0 ? (
            <div className="space-y-2">
              {data.attendanceBySection.map((section) => (
                <div key={section.label} className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_2.75rem] items-center gap-2 text-xs">
                  <span className="truncate theme-text-soft">{formatSectionText(section.label)}</span>
                  <StackedBar segments={attendanceSegments(section)} />
                  <span className="text-right font-medium tabular-nums theme-text">{percentOrDash(section.rate)}</span>
                </div>
              ))}
              <Legend segments={legendSegments} />
            </div>
          ) : (
            <EmptyChart message="You have not marked attendance yet." />
          )}
        </ChartCard>

        <AttendanceTrend weeks={data.attendanceTrend} />

        <ChartCard title="Subject-wise results" subtitle="Average score, with the lowest and highest">
          {data.subjectResults.length > 0 ? (
            <BarList
              max={100}
              format={percent}
              rows={data.subjectResults.map((subject) => ({ label: subject.label, value: subject.average, note: `${subject.lowest}-${subject.highest}%` }))}
            />
          ) : (
            <EmptyChart message="No results have been entered for your subjects yet." />
          )}
        </ChartCard>

        <ChartCard title="Student performance" subtitle="How many results fall in each score band">
          {hasScores ? (
            <ColumnChart rows={data.scoreBands.map((band) => ({ label: band.label, segments: [{ label: "results", value: band.value, color: chartColors.primary }] }))} />
          ) : (
            <EmptyChart message="Score bands appear once results are entered." />
          )}
        </ChartCard>

        {data.examPerformance.length > 0 ? (
          <ChartCard title="Recent exams" subtitle="Average score, latest 8 exams with results" className="lg:col-span-2">
            <BarList max={100} format={percent} rows={data.examPerformance.map((exam) => ({ label: exam.label, value: exam.average, note: `${exam.results} results` }))} />
          </ChartCard>
        ) : null}
      </div>
    </div>
  );
}
