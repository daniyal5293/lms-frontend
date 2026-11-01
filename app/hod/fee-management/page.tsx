"use client";

import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { FeeManagement } from "@/src/components/fees/FeeManagement";
import { AppShell } from "@/src/components/layout/AppShell";

export default function FeeManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["HOD"]}>
      <AppShell>
        <FeeManagement />
      </AppShell>
    </ProtectedRoute>
  );
}
