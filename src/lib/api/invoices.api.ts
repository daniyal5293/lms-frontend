import { apiFetch } from "@/src/lib/api/client";
import type { ApplicableFee, Invoice } from "@/src/lib/types";

export type GenerateInvoicePayload = {
  fees: Array<{
    studentId: string;
    feeTypeId: string;
  }>;
  month: string;
  year: string;
  dueDate: string;
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