import { apiFetch } from "@/src/lib/api/client";
import type { ApplicableFee } from "@/src/lib/types";

export type ApplicableFeePayload = {
  StudentId: string;
  FeeTypeId: string;
};

export type BulkApplicableFeeItem = {
  StudentId: string;
  FeeTypeId: string;
};

export type BulkApplicableFeePayload = BulkApplicableFeeItem[];

export async function listApplicableFees() {
  return apiFetch<ApplicableFee[]>("/api/applicablefee");
}

export async function listApplicableFeesByStudent(studentId: string) {
  return apiFetch<ApplicableFee[]>(`/api/applicablefee/student/${studentId}`);
}

export async function listApplicableFeesBySection(sectionId: string) {
  return apiFetch<ApplicableFee[]>(`/api/applicablefee/section/${encodeURIComponent(sectionId)}`);
}

export async function getApplicableFee(id: string) {
  return apiFetch<ApplicableFee>(`/api/applicablefee/${id}`);
}

export async function createApplicableFee(payload: ApplicableFeePayload) {
  return apiFetch<ApplicableFee>("/api/applicablefee", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createApplicableFeesBulk(payload: BulkApplicableFeePayload) {
  return apiFetch<ApplicableFee[]>("/api/applicablefee/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateApplicableFee(id: string, payload: ApplicableFeePayload) {
  return apiFetch<ApplicableFee>(`/api/applicablefee/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}