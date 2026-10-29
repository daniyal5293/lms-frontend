"use client";

import { LookupAdminPage } from "@/src/components/admin/LookupAdminPage";

export default function CohortsPage() {
  return (
    <LookupAdminPage
      kind="cohorts"
      labels={{ singular: "Cohort", plural: "Cohorts", description: "Intake groups students belong to.", placeholder: "e.g. Cohort-2027" }}
    />
  );
}
