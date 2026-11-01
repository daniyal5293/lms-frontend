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
import { createLookup, deleteLookup, listLookups, updateLookup, type LookupItem, type LookupKind } from "@/src/lib/api/lookups.api";

type Labels = { singular: string; plural: string; description: string; placeholder: string };

/** Admin list page for cohorts and campuses: add, rename, activate/deactivate, delete when unused. */
export function LookupAdminPage({ kind, labels }: { kind: LookupKind; labels: Labels }) {
  const { notify } = useNotifications();
  const [items, setItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LookupItem | "new" | null>(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await listLookups(kind));
    } catch (reason) {
      notify("error", `${labels.plural} unavailable`, reason instanceof ApiError ? reason.message : `Unable to load ${labels.plural.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [kind, labels.plural, notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const openForm = (item: LookupItem | "new") => {
    setEditing(item);
    setError("");
    setName(item === "new" ? "" : item.name);
    setIsActive(item === "new" ? true : item.isActive);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(`${labels.singular} name is required.`);
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), isActive };
      if (editing === "new") await createLookup(kind, payload);
      else if (editing) await updateLookup(kind, editing.id, payload);
      notify("success", `${labels.singular} saved`, payload.name);
      setEditing(null);
      void load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : `Unable to save the ${labels.singular.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: LookupItem) => {
    try {
      await updateLookup(kind, item.id, { name: item.name, isActive: !item.isActive });
      notify("success", item.isActive ? `${labels.singular} deactivated` : `${labels.singular} activated`, item.name);
      void load();
    } catch (reason) {
      notify("error", "Update failed", reason instanceof ApiError ? reason.message : "Unable to update.");
    }
  };

  const remove = async (item: LookupItem) => {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    try {
      await deleteLookup(kind, item.id);
      notify("success", `${labels.singular} deleted`, item.name);
      void load();
    } catch (reason) {
      notify("error", "Deletion failed", reason instanceof ApiError ? reason.message : "Unable to delete.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader title={labels.plural} description={labels.description} actions={<Button onClick={() => openForm("new")}>Add {labels.singular}</Button>} />

        <Card>
          {loading ? (
            <div className="text-sm theme-text-muted">Loading {labels.plural.toLowerCase()}...</div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm theme-text-muted">No {labels.plural.toLowerCase()} yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm theme-text">
                <thead className="border-b border-black/10">
                  <tr>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">{labels.singular}</th>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">Students</th>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">Status</th>
                    <th className="px-2.5 py-1.5 font-medium theme-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-black/5">
                      <td className="px-2.5 py-1.5 font-medium">{item.name}</td>
                      <td className="px-2.5 py-1.5 theme-text-soft">{item.studentCount}</td>
                      <td className="px-2.5 py-1.5">
                        <Badge tone={item.isActive ? "success" : "warning"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={() => openForm(item)} className="theme-text-primary underline underline-offset-4">Edit</button>
                          <button type="button" onClick={() => void toggle(item)} className="text-amber-600 underline underline-offset-4">{item.isActive ? "Deactivate" : "Activate"}</button>
                          <button
                            type="button"
                            onClick={() => void remove(item)}
                            disabled={item.studentCount > 0}
                            title={item.studentCount > 0 ? "Move its students first, or deactivate it" : undefined}
                            className="text-red-600 underline underline-offset-4 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Modal
          open={editing !== null}
          title={editing === "new" ? `Add ${labels.singular}` : `Edit ${labels.singular}`}
          description="Inactive items stay on existing students but can't be chosen for new ones."
          onClose={() => setEditing(null)}
        >
          <form className="space-y-2.5" onSubmit={save} noValidate>
            <Input label="Name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder={labels.placeholder} error={error || undefined} />
            <label className="flex items-center gap-2 text-sm theme-text-soft">
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
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
