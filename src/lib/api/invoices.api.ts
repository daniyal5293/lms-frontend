import { apiFetch } from "@/src/lib/api/client";
import type { ApplicableFee, Invoice, Transaction } from "@/src/lib/types";

export type GenerateInvoicePayload = {
  fees: Array<{
    studentId: string;
    feeTypeId: string;
  }>;
  month: string;
  year: string;
  dueDate: string;
};

export type PayInvoicePayload = {
  invoiceID: string;
  amount: number;
  mode: number;
  transactionRef: string;
};

export async function generateInvoice(payload: GenerateInvoicePayload) {
  return apiFetch<Invoice[]>("/api/invoice/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listPendingFeesByStudent(studentId: string) {
  return apiFetch<ApplicableFee[]>(`/api/invoice/pending/${studentId}`);
}

export async function listInvoiceHistoryByStudent(studentId: string) {
  return apiFetch<Invoice[]>(`/api/invoice/history/${studentId}`);
}

export async function listTransactions() {
  return apiFetch<Transaction[]>("/api/transaction");
}

export async function payInvoice(invoiceId: string, payload: PayInvoicePayload) {
  return apiFetch(`/api/Transaction/pay/${invoiceId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function markInvoiceUnpaid(invoiceId: string) {
  return apiFetch(`/api/Transaction/mark-unpaid/${invoiceId}`, {
    method: "POST",
  });
}