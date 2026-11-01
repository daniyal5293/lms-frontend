import { apiFetch } from "@/src/lib/api/client";
import type { ApplicableFee, Invoice } from "@/src/lib/types";

export type GenerateInvoiceItem = {
  StudentId: string;
  FeeTypeId: string;
};

export type GenerateInvoicePayload = {
  fees: GenerateInvoiceItem[];
  month: string;
  year: string;
  dueDate: string;
};

export type BulkGenerateInvoicePayload = GenerateInvoicePayload;

export type SkippedFee = { studentId: string; student: string; fee: string; reason: string };

export type InvoiceStatus = "Unpaid" | "Partial" | "Paid" | "Overdue" | "Voided";

export type InvoiceRow = {
  id: string;
  invoiceNum: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  section?: string | null;
  feeTypeName: string;
  amount: number;
  discount: number;
  lateFee: number;
  amountPaid: number;
  netAmount: number;
  amountDue: number;
  status: InvoiceStatus;
  month: string;
  year: string;
  currency: string;
  dueDate: string;
  isVoided: boolean;
  voidReason?: string | null;
};

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export type InvoiceFilters = {
  status?: string;
  month?: string;
  year?: string;
  sectionId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export const PAYMENT_MODES = ["Cash", "Card", "BankTransfer", "JazzCash", "EasyPaisa"] as const;
export const paymentModeLabel = (mode: string) => (mode === "BankTransfer" ? "Bank transfer" : mode);

export type PayInvoicePayload = {
  invoiceID: string;
  amount: number;
  mode: number;
  transactionRef: string;
};

export type TransactionRow = {
  transactionId: string;
  invoiceId: string;
  invoiceNum: string;
  feeTypeName: string;
  studentId: string;
  studentName: string;
  amount: number;
  currency: string;
  mode: string;
  kind: "Payment" | "Reversal";
  transactionReference: string;
  paidAt: string;
  reason?: string | null;
  recordedBy?: string | null;
  isReversed: boolean;
};

export type TransactionFilters = {
  search?: string;
  from?: string;
  to?: string;
  mode?: string;
  page?: number;
  pageSize?: number;
};

export type Receipt = {
  receiptNo: string;
  transaction: TransactionRow;
  studentCode: string;
  section?: string | null;
  period: string;
  invoiceNet: number;
  invoicePaid: number;
  balanceDue: number;
};

export type Adjustment = {
  id: string;
  type: "Discount" | "Scholarship" | "LateFee";
  amount: number;
  reason: string;
  createdAt: string;
  recordedBy?: string | null;
  isRemoved: boolean;
  removeReason?: string | null;
};

export const ADJUSTMENT_TYPES = ["Discount", "Scholarship", "LateFee"] as const;
export const adjustmentLabel = (type: string) => (type === "LateFee" ? "Late fee" : type);

const toQuery = (filters: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
};

export async function generateInvoice(payload: GenerateInvoicePayload) {
  return apiFetch<{ created: InvoiceRow[]; skipped: SkippedFee[] }>("/api/invoice/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateInvoicesBulk(payload: BulkGenerateInvoicePayload) {
  return apiFetch<{ created: InvoiceRow[]; skipped: SkippedFee[] }>("/api/invoice/generate/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listInvoices(filters: InvoiceFilters) {
  return apiFetch<Paged<InvoiceRow>>(`/api/invoice${toQuery(filters)}`);
}

export async function listPendingFeesByStudent(studentId: string) {
  return apiFetch<ApplicableFee[]>(`/api/invoice/pending/${studentId}`);
}

export async function listInvoiceHistoryByStudent(studentId: string) {
  return apiFetch<Invoice[]>(`/api/invoice/history/${studentId}`);
}

export async function listTransactions(filters: TransactionFilters) {
  return apiFetch<Paged<TransactionRow>>(`/api/transaction${toQuery(filters)}`);
}

export async function payInvoice(invoiceId: string, payload: PayInvoicePayload) {
  return apiFetch(`/api/Transaction/pay/${invoiceId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function reverseTransaction(transactionId: string, reason: string) {
  return apiFetch(`/api/Transaction/${transactionId}/reverse`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getReceipt(transactionId: string) {
  return apiFetch<Receipt>(`/api/Transaction/${transactionId}/receipt`);
}

export async function voidInvoice(invoiceId: string, reason: string) {
  return apiFetch(`/api/invoice/${invoiceId}/void`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function listAdjustments(invoiceId: string) {
  return apiFetch<Adjustment[]>(`/api/invoice/${invoiceId}/adjustments`);
}

export async function addAdjustment(invoiceId: string, payload: { type: number; amount: number; reason: string }) {
  return apiFetch(`/api/invoice/${invoiceId}/adjustments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeAdjustment(invoiceId: string, adjustmentId: string, reason: string) {
  return apiFetch(`/api/invoice/${invoiceId}/adjustments/${adjustmentId}/remove`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
