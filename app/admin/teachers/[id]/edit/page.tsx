"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { getTeacherById, updateTeacher } from "@/src/lib/api/teachers.api";
import { ApiError } from "@/src/lib/api/client";

const initialState = {
  Fullname: "",
  Email: "",
  Address: "",
  Department: "",
  Salary: "",
  CNIC: "",
  DateOfBirth: "",
  HireDate: "",
  IdentificationNumber: "",
  Qualification: "",
};

export default function EditTeacherPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const teacher = await getTeacherById(params.id);
        setForm({
          Fullname: teacher.Fullname ?? teacher.FullName ?? "",
          Email: teacher.Email ?? "",
          Address: teacher.Address ?? "",
          Department: teacher.Department ?? "",
          Salary: teacher.Salary ? String(teacher.Salary) : "",
          CNIC: teacher.CNIC ?? "",
          DateOfBirth: teacher.DateOfBirth ? teacher.DateOfBirth.slice(0, 10) : "",
          HireDate: teacher.HireDate ? teacher.HireDate.slice(0, 10) : "",
          IdentificationNumber: teacher.IdentificationNumber ?? "",
          Qualification: teacher.Qualification ?? "",
        });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Unable to load teacher details.";
        notify("error", "Teacher load failed", message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [notify, params.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await updateTeacher({
        ...form,
        Salary: Number(form.Salary),
      });
      notify("success", "Teacher updated", "The teacher record was updated successfully.");
      router.push(`/admin/teachers/${params.id}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to update teacher.";
      notify("error", "Update failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppShell><div className="py-10 text-center text-[#888888]">Loading teacher record...</div></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Edit Teacher" description="Update employment and academic information." />

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Full name" value={form.Fullname} onChange={(event) => setForm((current) => ({ ...current, Fullname: event.target.value }))} />
            <Input label="Email" type="email" value={form.Email} onChange={(event) => setForm((current) => ({ ...current, Email: event.target.value }))} />
            <Input label="Department" value={form.Department} onChange={(event) => setForm((current) => ({ ...current, Department: event.target.value }))} />
            <Input label="Salary" type="number" value={form.Salary} onChange={(event) => setForm((current) => ({ ...current, Salary: event.target.value }))} />
            <Input label="CNIC" value={form.CNIC} onChange={(event) => setForm((current) => ({ ...current, CNIC: event.target.value }))} />
            <Input label="Date of birth" type="date" value={form.DateOfBirth} onChange={(event) => setForm((current) => ({ ...current, DateOfBirth: event.target.value }))} />
            <Input label="Hire date" type="date" value={form.HireDate} onChange={(event) => setForm((current) => ({ ...current, HireDate: event.target.value }))} />
            <Input label="Identification number" value={form.IdentificationNumber} onChange={(event) => setForm((current) => ({ ...current, IdentificationNumber: event.target.value }))} />
            <div className="md:col-span-2">
              <Input label="Qualification" value={form.Qualification} onChange={(event) => setForm((current) => ({ ...current, Qualification: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Input label="Address" value={form.Address} onChange={(event) => setForm((current) => ({ ...current, Address: event.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
