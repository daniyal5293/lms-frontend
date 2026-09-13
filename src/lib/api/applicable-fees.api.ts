import { apiFetch } from "@/src/lib/api/client";
import type { ApplicableFee } from "@/src/lib/types";

export type ApplicableFeePayload = {
  StudentId: string;
  FeeTypeId: string;
};

export async function listApplicableFees() {
  return apiFetch<ApplicableFee[]>("/api/applicablefee");
}

export async function listApplicableFeesByStudent(studentId: string) {
  return apiFetch<ApplicableFee[]>(`/api/applicablefee/student/${studentId}`);
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

export async function updateApplicableFee(id: string, payload: ApplicableFeePayload) {
  return apiFetch<ApplicableFee>(`/api/applicablefee/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}