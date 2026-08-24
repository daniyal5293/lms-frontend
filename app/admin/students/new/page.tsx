"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import { listSections } from "@/src/lib/api/sections.api";
import { createStudent } from "@/src/lib/api/students.api";
import type { Section } from "@/src/lib/types";

const initialState = {
  fullName: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: "",
  enrollmentDate: "",
  cnic: "",
  sectionId: "",
};

export default function NewStudentPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialState);
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadSections = async () => {
      try {
        setSections(await listSections());
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Unable to load sections.";
        notify("error", "Section load failed", message);
      } finally {
        setLoadingSections(false);
      }
    };

    void loadSections();
  }, [notify]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.phoneNumber.trim() || !form.dateOfBirth || !form.enrollmentDate || !form.cnic.trim() || !form.sectionId) {
      notify("error", "Validation failed", "Complete all student fields before submitting.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      notify("error", "Validation failed", "Enter a valid student email address.");
      return;
    }

    setSubmitting(true);
    try {
      await createStudent({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        dateOfBirth: form.dateOfBirth,
        enrollmentDate: form.enrollmentDate,
        cnic: form.cnic.trim(),
        sectionId: form.sectionId,
      });
      notify("success", "Student created", "The student account was created successfully.");
      router.push("/admin/students");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to create student.";
      notify("error", "Student creation failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader title="Create Student" description="Add a student account and assign it to an academic section." />
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
              <Input label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              <Input label="Phone number" type="tel" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
              <Input label="CNIC" value={form.cnic} onChange={(event) => setForm((current) => ({ ...current, cnic: event.target.value }))} />
              <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))} />
              <Input label="Enrollment date" type="date" value={form.enrollmentDate} onChange={(event) => setForm((current) => ({ ...current, enrollmentDate: event.target.value }))} />
              <Select label="Section" value={form.sectionId} onChange={(event) => setForm((current) => ({ ...current, sectionId: event.target.value }))} disabled={loadingSections}>
                <option value="">{loadingSections ? "Loading sections..." : "Select a section"}</option>
                {sections.map((section) => {
                  const id = section.Id ?? section.id ?? "";
                  return <option key={id} value={id}>{section.Name}{section.Course?.Name ? ` - ${section.Course.Name}` : ""}</option>;
                })}
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" loading={submitting}>{submitting ? "Creating..." : "Create Student"}</Button>
            </div>
          </form>
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}