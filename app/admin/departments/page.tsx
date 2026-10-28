"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { ApiError } from "@/src/lib/api/client";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  type Department,
} from "@/src/lib/api/departments.api";

type FormState = { name: string; description: string; isActive: boolean };

const emptyForm: FormState = { name: "", description: "", isActive: true };

export default function DepartmentsPage() {
  const { notify } = useNotifications();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Department | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setDepartments(await listDepartments());
    } catch (reason) {
      notify("error", "Department list failed", reason instanceof ApiError ? reason.message : "Unable to load departments.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const openForm = (department: Department | "new") => {
    setEditing(department);
    setError("");
    setForm(
      department === "new"
        ? emptyForm
        : { name: department.name, description: department.description ?? "", isActive: department.isActive },
    );
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Department name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || null, isActive: form.isActive };
      if (editing === "new") {
        await createDepartment(payload);
        notify("success", "Department created", `${payload.name} was added.`);
      } else if (editing) {
        await updateDepartment(editing.departmentId, payload);
        notify("success", "Department updated", `${payload.name} was saved.`);
      }
      setEditing(null);
      void load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Unable to save the department.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (department: Department) => {
    try {
      await updateDepartment(department.departmentId, {
        name: department.name,
        description: department.description ?? null,
        isActive: !department.isActive,
      });
      notify("success", department.isActive ? "Department deactivated" : "Department activated", department.name);
      void load();
    } catch (reason) {
      notify("error", "Update failed", reason instanceof ApiError ? reason.message : "Unable to update the department.");
    }
  };

  const remove = async (department: Department) => {
    if (!window.confirm(`Delete ${department.name}? This cannot be undone.`)) return;
    try {
      await deleteDepartment(department.departmentId);
      notify("success", "Department deleted", department.name);
      void load();
    } catch (reason) {
      notify("error", "Deletion failed", reason instanceof ApiError ? reason.message : "Unable to delete the department.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader
          title="Departments"
          description="Departments that teachers and students belong to."
          actions={<Button onClick={() => openForm("new")}>Add Department</Button>}
        />

        <Card>
          {loading ? (
            <div className="text-sm theme-text-muted">Loading departments...</div>
          ) : departments.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="text-lg font-semibold theme-text">No departments yet</h3>
              <p className="mt-2 text-sm theme-text-muted">Add a department so teachers and students can be assigned to it.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm theme-text">
                <thead className="border-b border-black/10">
                  <tr>
                    <th className="px-3 py-3 font-medium theme-text-muted">Department</th>
                    <th className="px-3 py-3 font-medium theme-text-muted">Teachers</th>
                    <th className="px-3 py-3 font-medium theme-text-muted">Students</th>
                    <th className="px-3 py-3 font-medium theme-text-muted">Status</th>
                    <th className="px-3 py-3 font-medium theme-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((department) => {
                    const inUse = department.teacherCount + department.studentCount > 0;
                    return (
                      <tr key={department.departmentId} className="border-b border-black/5 align-top">
                        <td className="px-3 py-3">
                          <div className="font-medium">{department.name}</div>
                          {department.description ? <div className="mt-0.5 max-w-md text-xs theme-text-muted">{department.description}</div> : null}
                        </td>
                        <td className="px-3 py-3 theme-text-soft">{department.teacherCount}</td>
                        <td className="px-3 py-3 theme-text-soft">{department.studentCount}</td>
                        <td className="px-3 py-3">
                          <Badge tone={department.isActive ? "success" : "warning"}>{department.isActive ? "Active" : "Inactive"}</Badge>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={() => openForm(department)} className="theme-text-primary underline underline-offset-4">Edit</button>
                            <button type="button" onClick={() => void toggleActive(department)} className="text-amber-300 underline underline-offset-4">
                              {department.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void remove(department)}
                              disabled={inUse}
                              title={inUse ? "Move its teachers and students first, or deactivate it" : undefined}
                              className="text-red-300 underline underline-offset-4 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Modal
          open={editing !== null}
          title={editing === "new" ? "Add Department" : "Edit Department"}
          description="Inactive departments stay on existing records but can't be chosen for new ones."
          onClose={() => setEditing(null)}
        >
          <form className="space-y-4" onSubmit={save} noValidate>
            <Input
              label="Name"
              maxLength={100}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g. Science"
              error={error || undefined}
            />
            <label className="block w-full text-sm theme-text" htmlFor="department-description">
              <span className="mb-2 block theme-text-soft">Description (optional)</span>
              <textarea
                id="department-description"
                rows={3}
                maxLength={500}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="e.g. Pre-Engineering and Pre-Medical programs"
                className="w-full rounded-xl border border-black/10 theme-bg-input px-3 py-2.5 theme-text placeholder:theme-text-muted focus:theme-border-primary focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-sm theme-text-soft">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active
            </label>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" loading={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </Modal>
      </AppShell>
    </ProtectedRoute>
  );
}
