"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { createRole, getRoles } from "@/src/lib/api/roles.api";
import { ApiError } from "@/src/lib/api/client";

export default function RolesPage() {
  const { notify } = useNotifications();
  const [roles, setRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to load roles.";
      notify("error", "Role load failed", message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRoles();
  }, [loadRoles]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newRole.trim()) {
      notify("error", "Validation failed", "Role name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await createRole(newRole.trim());
      setNewRole("");
      notify("success", "Role created", "The role was created successfully.");
      loadRoles();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to create role.";
      notify("error", "Role creation failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader title="Roles" description="Manage available application roles and access groups." />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          {loading ? <div className="text-sm text-[#888888]">Loading roles...</div> : (
            <div className="flex flex-wrap gap-3">
              {roles.length === 0 ? <p className="text-[#888888]">No roles available.</p> : roles.map((role) => (
                <span key={role} className="rounded-full border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white">{role}</span>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input label="Role name" placeholder="Teacher" value={newRole} onChange={(event) => setNewRole(event.target.value)} />
            <Button type="submit" className="w-full" loading={submitting}>{submitting ? "Creating..." : "Create Role"}</Button>
          </form>
        </Card>
      </div>
      </AppShell>
    </ProtectedRoute>
  );
}
