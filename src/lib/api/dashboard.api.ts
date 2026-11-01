import { apiFetch } from "@/src/lib/api/client";

export type CountPoint = { label: string; value: number };
export type ScorePoint = { label: string; average: number; results: number };
export type SubjectResult = { label: string; average: number; highest: number; lowest: number; results: number };
export type AttendanceWeek = { label: string; rate: number; marked: number };

export type AttendanceSummary = {
  label?: string | null;
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  rate: number | null;
};

export type FeeOverview = {
  currency: string;
  otherCurrencyInvoices: number;
  invoices: number;
  billed: number;
  collected: number;
  outstanding: number;
  overdue: number;
  months: { label: string; billed: number; collected: number }[];
};

export type AdminDashboard = {
  totalStudents: number;
  activeStudents: number;
  teachers: number;
  sections: number;
  courses: number;
  enrolmentByCohort: CountPoint[];
  departments: { name: string; students: number; teachers: number }[];
  attendance: AttendanceSummary;
  fees: FeeOverview;
};

export type HodDashboard = {
  department: string;
  students: number;
  teachers: number;
  sections: number;
  attendanceRate: number | null;
  averageScore: number | null;
  studentsBySection: CountPoint[];
  attendanceTrend: AttendanceWeek[];
  coursePerformance: ScorePoint[];
  teacherPerformance: { name: string; exams: number; results: number; averageScore: number | null; attendanceRate: number | null }[];
};

export type TeacherDashboard = {
  sections: number;
  students: number;
  exams: number;
  examsAwaitingResults: number;
  attendanceRate: number | null;
  averageScore: number | null;
  attendanceBySection: AttendanceSummary[];
  attendanceTrend: AttendanceWeek[];
  examPerformance: ScorePoint[];
  subjectResults: SubjectResult[];
  scoreBands: CountPoint[];
};

export const getAdminDashboard = () => apiFetch<AdminDashboard>("/api/dashboard/admin");
export const getHodDashboard = () => apiFetch<HodDashboard>("/api/dashboard/hod");
export const getTeacherDashboard = () => apiFetch<TeacherDashboard>("/api/dashboard/teacher");
