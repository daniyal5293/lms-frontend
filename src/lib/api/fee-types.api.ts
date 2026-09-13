import { apiFetch } from "@/src/lib/api/client";
import type { FeeType } from "@/src/lib/types";

export type FeeTypePayload = {
  FeeCategoryId: string;
  Name: string;
  Amount: number;
  Per: string;
  AcademicTerm: string;
  Currency: string;
  ApplicableDate: string;
  IsActive: boolean;
};

export async function listFeeTypes() {
  return apiFetch<FeeType[]>("/api/feetype");
}

export async function getFeeType(id: string) {
  return apiFetch<FeeType>(`/api/feetype/${id}`);
}

export async function createFeeType(payload: FeeTypePayload) {
  return apiFetch<FeeType>("/api/feetype", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFeeType(id: string, payload: FeeTypePayload) {
  return apiFetch<FeeType>(`/api/feetype/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}