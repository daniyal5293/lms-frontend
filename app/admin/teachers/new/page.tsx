"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { createTeacher } from "@/src/lib/api/teachers.api";
import { ApiError } from "@/src/lib/api/client";

const initialState = {
  email: "",
  fullName: "",
  cnic: "",
  qualification: "",
  identificationNumber: "",
  department: "",
  dateOfBirth: "",
  hireDate: "",
  address: "",
  salary: "",
};

export default function NewTeacherPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: Partial<Record<keyof typeof initialState, string>> = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = "Enter a valid email.";
    if (!form.cnic.trim()) nextErrors.cnic = "CNIC is required.";
    if (!form.qualification.trim()) nextErrors.qualification = "Qualification is required.";
    if (!form.identificationNumber.trim()) nextErrors.identificationNumber = "Employee ID is required.";
    if (!form.department.trim()) nextErrors.department = "Department is required.";
    if (!form.dateOfBirth) nextErrors.dateOfBirth = "Date of birth is required.";
    if (!form.hireDate) nextErrors.hireDate = "Hire date is required.";
    if (!form.address.trim()) nextErrors.address = "Address is required.";
    if (!form.salary || Number(form.salary) <= 0) nextErrors.salary = "Salary must be greater than zero.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      await createTeacher({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        cnic: form.cnic.trim(),
        qualification: form.qualification.trim(),
        identificationNumber: form.identificationNumber.trim(),
        department: form.department.trim(),
        dateOfBirth: `${form.dateOfBirth}T00:00:00`,
        hireDate: `${form.hireDate}T00:00:00`,
        address: form.address.trim(),
        salary: Number(form.salary),
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
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
      <PageHeader title="Create Teacher" description="Add a new teacher record with the required employment details." />

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} error={errors.fullName} />
            <Input label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} error={errors.email} />
            <Input label="CNIC" value={form.cnic} onChange={(event) => setForm((current) => ({ ...current, cnic: event.target.value }))} error={errors.cnic} />
            <Input label="Qualification" value={form.qualification} onChange={(event) => setForm((current) => ({ ...current, qualification: event.target.value }))} error={errors.qualification} />
            <Input label="Employee identification number" value={form.identificationNumber} onChange={(event) => setForm((current) => ({ ...current, identificationNumber: event.target.value }))} error={errors.identificationNumber} />
            <Input label="Department" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} error={errors.department} />
            <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))} error={errors.dateOfBirth} />
            <Input label="Hire date" type="date" value={form.hireDate} onChange={(event) => setForm((current) => ({ ...current, hireDate: event.target.value }))} error={errors.hireDate} />
            <Input label="Salary" type="number" value={form.salary} onChange={(event) => setForm((current) => ({ ...current, salary: event.target.value }))} error={errors.salary} />
            <Input label="Address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} error={errors.address} />
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
    </ProtectedRoute>
  );
}






