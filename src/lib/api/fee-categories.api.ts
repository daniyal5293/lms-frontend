import { apiFetch } from "@/src/lib/api/client";
import type { FeeCategory } from "@/src/lib/types";

export type FeeCategoryPayload = {
  categoryName: string;
};

export async function listFeeCategories() {
  return apiFetch<FeeCategory[]>("/api/feecategory");
}

export async function getFeeCategory(id: string) {
  return apiFetch<FeeCategory>(`/api/feecategory/${id}`);
}

export async function createFeeCategory(categoryName: string) {
  return apiFetch<FeeCategory>("/api/feecategory", {
    method: "POST",
    body: JSON.stringify({ categoryName }),
  });
}

export async function updateFeeCategory(id: string, payload: FeeCategoryPayload) {
  return apiFetch<FeeCategory>(`/api/feecategory/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}