import { apiFetch } from "@/src/lib/api/client";
import type { Paged } from "@/src/lib/api/invoices.api";

export type FeeReportRow = { label: string; invoices: number; billed: number; collected: number; outstanding: number };

export type FeeSummary = {
  currency: string;
  currencies: string[];
  invoices: number;
  billed: number;
  discounts: number;
  lateFees: number;
  netBilled: number;
  collected: number;
  outstanding: number;
  overdue: number;
  byStatus: Record<string, number>;
  byMonth: FeeReportRow[];
  byFeeType: FeeReportRow[];
  byMode: { mode: string; amount: number }[];
};

export type Defaulter = {
  studentId: string;
  studentName: string;
  studentCode: string;
  section?: string | null;
  invoices: number;
  overdue: number;
  oldestDueDate: string;
};

export type LedgerEntry = {
  date: string;
  type: string;
  description: string;
  invoiceNum: string;
  debit: number;
  credit: number;
  balance: number;
};

export type Ledger = {
  currencies: string[];
  studentId: string;
  studentName: string;
  studentCode: string;
  section?: string | null;
  currency: string;
  balance: number;
  entries: LedgerEntry[];
};

export type FeeStudent = {
  studentId: string;
  fullName: string;
  studentCode: string;
  section?: string | null;
  sectionId?: string | null;
};

export async function getFeeSummary(filters: { month?: string; year?: string; sectionId?: string; currency?: string }) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value) as [string, string][]).toString();
  return apiFetch<FeeSummary>(`/api/feereport/summary${query ? `?${query}` : ""}`);
}

export async function getDefaulters(sectionId: string, currency: string, page: number) {
  return apiFetch<Paged<Defaulter>>(`/api/feereport/defaulters?page=${page}${sectionId ? `&sectionId=${sectionId}` : ""}${currency ? `&currency=${currency}` : ""}`);
}

export async function getLedger(studentId: string, currency = "") {
  return apiFetch<Ledger>(`/api/feereport/ledger/${studentId}${currency ? `?currency=${currency}` : ""}`);
}

export async function listFeeStudents() {
  return apiFetch<FeeStudent[]>("/api/feereport/students");
}
