"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { DepartmentSelect } from "@/src/components/ui/DepartmentSelect";
import { GroupedOptions } from "@/src/components/ui/GroupedOptions";
import { Input } from "@/src/components/ui/Input";
import { LookupSelect } from "@/src/components/ui/LookupSelect";
import { Select } from "@/src/components/ui/Select";
import { listSections } from "@/src/lib/api/sections.api";
import type { CreateStudentPayload } from "@/src/lib/api/students.api";
import type { Section } from "@/src/lib/types";
import { formatSectionShort } from "@/src/lib/utils";

export type StudentFormValues = {
  fullName: string;
  email: string;
  studentCode: string;
  phoneNumber: string;
  fatherName: string;
  gender: string;
  majorSubject: string;
  cohortId: string;
  campusId: string;
  departmentId: string;
  sectionId: string;
  dateOfBirth: string;
  enrollmentDate: string;
  cnic: string;
};

export const emptyStudentForm: StudentFormValues = {
  fullName: "",
  email: "",
  studentCode: "",
  phoneNumber: "",
  fatherName: "",
  gender: "",
  majorSubject: "",
  cohortId: "",
  campusId: "",
  departmentId: "",
  sectionId: "",
  dateOfBirth: "",
  enrollmentDate: "",
  cnic: "",
};

type Errors = Partial<Record<keyof StudentFormValues, string>>;

const MAJOR_SUBJECTS = ["Pre-Engineering", "Pre-Medical"];

// Same rules as the API (StudentProfileFieldsDto), so most mistakes are caught before submitting
export function validateStudentForm(values: StudentFormValues): Errors {
  const errors: Errors = {};
  if (!values.fullName.trim()) errors.fullName = "Full name is required.";
  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = "Enter a valid email.";
  if (!values.studentCode.trim()) errors.studentCode = "Student code is required.";
  else if (!/^\d{1,10}$/.test(values.studentCode.trim())) errors.studentCode = "Use digits only, up to 10.";
  if (!values.phoneNumber.trim()) errors.phoneNumber = "Phone number is required.";
  else if (!/^\+?[0-9][0-9\- ]{8,14}[0-9]$/.test(values.phoneNumber.trim())) errors.phoneNumber = "Enter a valid phone number, e.g. 0300-1234567.";
  if (!values.fatherName.trim()) errors.fatherName = "Father's name is required.";
  if (!values.gender) errors.gender = "Gender is required.";
  if (!values.majorSubject.trim()) errors.majorSubject = "Major subject is required.";
  if (!values.cohortId) errors.cohortId = "Cohort is required.";
  if (!values.campusId) errors.campusId = "Campus is required.";
  if (!values.departmentId) errors.departmentId = "Department is required.";
  if (!values.sectionId) errors.sectionId = "Section is required.";
  if (!values.enrollmentDate) errors.enrollmentDate = "Enrollment date is required.";
  return errors;
}

export function toStudentPayload(values: StudentFormValues): CreateStudentPayload {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    studentCode: values.studentCode.trim(),
    phoneNumber: values.phoneNumber.trim(),
    fatherName: values.fatherName.trim(),
    gender: values.gender,
    majorSubject: values.majorSubject.trim(),
    cohortId: values.cohortId,
    campusId: values.campusId,
    departmentId: values.departmentId,
    sectionId: values.sectionId,
    // Empty dates can't bind to the API's DateTime, so send null
    dateOfBirth: values.dateOfBirth || null,
    enrollmentDate: values.enrollmentDate,
    cnic: values.cnic.trim(),
  };
}

const sectionClass = (section: Section) => `Class ${section.IntermediateClass ?? section.intermediateClass ?? "—"}`;
const sectionLabel = (section: Section) =>
  formatSectionShort(section.IntermediateClass ?? section.intermediateClass, section.sectionName ?? section.Name, "Section");

/** Shared create/edit form for students. */
export function StudentForm({
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
}: {
  initialValues: StudentFormValues;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (values: StudentFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listSections()
      .then((data) =>
        setSections(
          [...data].sort((a, b) => sectionClass(a).localeCompare(sectionClass(b)) || sectionLabel(a).localeCompare(sectionLabel(b))),
        ),
      )
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false));
  }, []);

  const set = (field: keyof StudentFormValues) => (value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateStudentForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-8" onSubmit={submit} noValidate>
      <fieldset className="space-y-2.5">
        <legend className="mb-1 text-sm font-semibold uppercase tracking-wide theme-text-primary">Student</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Student code" inputMode="numeric" maxLength={10} placeholder="e.g. 2001061" value={form.studentCode} onChange={(event) => set("studentCode")(event.target.value.replace(/\D/g, ""))} error={errors.studentCode} />
          <Input label="Full name" value={form.fullName} onChange={(event) => set("fullName")(event.target.value)} error={errors.fullName} />
          <Input label="Father's name" value={form.fatherName} onChange={(event) => set("fatherName")(event.target.value)} error={errors.fatherName} />
          <Select label="Gender" value={form.gender} onChange={(event) => set("gender")(event.target.value)} error={errors.gender}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </Select>
          <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(event) => set("dateOfBirth")(event.target.value)} />
          <Input label="CNIC / B-Form" value={form.cnic} onChange={(event) => set("cnic")(event.target.value)} />
        </div>
      </fieldset>

      <fieldset className="space-y-2.5">
        <legend className="mb-1 text-sm font-semibold uppercase tracking-wide theme-text-primary">Contact</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Email" type="email" value={form.email} onChange={(event) => set("email")(event.target.value)} error={errors.email} />
          <Input label="Phone number" type="tel" placeholder="0300-1234567" value={form.phoneNumber} onChange={(event) => set("phoneNumber")(event.target.value)} error={errors.phoneNumber} />
        </div>
      </fieldset>

      <fieldset className="space-y-2.5">
        <legend className="mb-1 text-sm font-semibold uppercase tracking-wide theme-text-primary">Enrollment</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Major subject" list="major-subjects" placeholder="e.g. Pre-Engineering" value={form.majorSubject} onChange={(event) => set("majorSubject")(event.target.value)} error={errors.majorSubject} />
          <datalist id="major-subjects">
            {MAJOR_SUBJECTS.map((subject) => <option key={subject} value={subject} />)}
          </datalist>
          <LookupSelect kind="cohorts" label="Cohort" value={form.cohortId} onChange={set("cohortId")} error={errors.cohortId} />
          <LookupSelect kind="campuses" label="Campus" value={form.campusId} onChange={set("campusId")} error={errors.campusId} />
          <DepartmentSelect value={form.departmentId} onChange={set("departmentId")} error={errors.departmentId} />
          <Select label="Section" value={form.sectionId} onChange={(event) => set("sectionId")(event.target.value)} disabled={loadingSections} error={errors.sectionId}>
            <option value="">{loadingSections ? "Loading sections..." : "Select a section"}</option>
            <GroupedOptions items={sections} groupOf={sectionClass} valueOf={(section) => section.Id ?? section.id ?? ""} labelOf={sectionLabel} />
          </Select>
          <Input label="Enrollment date" type="date" value={form.enrollmentDate} onChange={(event) => set("enrollmentDate")(event.target.value)} error={errors.enrollmentDate} />
        </div>
      </fieldset>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>{submitting ? submittingLabel : submitLabel}</Button>
      </div>
    </form>
  );
}
