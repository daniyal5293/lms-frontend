"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { createTeacher } from "@/src/lib/api/teachers.api";
import { ApiError } from "@/src/lib/api/client";

const initialState = {
  Fullname: "",
  Email: "",
  Department: "",
  Salary: "",
  CNIC: "",
  DateOfBirth: "",
  HireDate: "",
};

export default function NewTeacherPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: Partial<Record<keyof typeof initialState, string>> = {};
    if (!form.Fullname.trim()) nextErrors.Fullname = "Full name is required.";
    if (!form.Email.trim()) nextErrors.Email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.Email)) nextErrors.Email = "Enter a valid email.";
    if (!form.Department.trim()) nextErrors.Department = "Department is required.";
    if (!form.CNIC.trim()) nextErrors.CNIC = "CNIC is required.";
    if (!form.DateOfBirth) nextErrors.DateOfBirth = "Date of birth is required.";
    if (!form.HireDate) nextErrors.HireDate = "Hire date is required.";
    if (!form.Salary || Number(form.Salary) <= 0) nextErrors.Salary = "Salary must be greater than zero.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      await createTeacher({
        ...form,
        Salary: Number(form.Salary),
      });
      notify("success", "Teacher created", "The teacher was added successfully.");
      router.push("/admin/teachers");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to create teacher.";
      notify("error", "Creation failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Create Teacher" description="Add a new teacher record with the required employment details." />

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Full name" value={form.Fullname} onChange={(event) => setForm((current) => ({ ...current, Fullname: event.target.value }))} error={errors.Fullname} />
            <Input label="Email" type="email" value={form.Email} onChange={(event) => setForm((current) => ({ ...current, Email: event.target.value }))} error={errors.Email} />
            <Input label="Department" value={form.Department} onChange={(event) => setForm((current) => ({ ...current, Department: event.target.value }))} error={errors.Department} />
            <Input label="Salary" type="number" value={form.Salary} onChange={(event) => setForm((current) => ({ ...current, Salary: event.target.value }))} error={errors.Salary} />
            <Input label="CNIC" value={form.CNIC} onChange={(event) => setForm((current) => ({ ...current, CNIC: event.target.value }))} error={errors.CNIC} />
            <Input label="Date of birth" type="date" value={form.DateOfBirth} onChange={(event) => setForm((current) => ({ ...current, DateOfBirth: event.target.value }))} error={errors.DateOfBirth} />
            <Input label="Hire date" type="date" value={form.HireDate} onChange={(event) => setForm((current) => ({ ...current, HireDate: event.target.value }))} error={errors.HireDate} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? "Saving..." : "Create Teacher"}
            </Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
