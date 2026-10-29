"use client";

import { LookupAdminPage } from "@/src/components/admin/LookupAdminPage";

export default function CampusesPage() {
  return (
    <LookupAdminPage
      kind="campuses"
      labels={{ singular: "Campus", plural: "Campuses", description: "Campuses students are enrolled at.", placeholder: "e.g. Qayyum-Abad Campus" }}
    />
  );
}
