"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InvoicesTab } from "@/src/components/fees/InvoicesTab";
import { ReportsTab } from "@/src/components/fees/ReportsTab";
import { TransactionsTab } from "@/src/components/fees/TransactionsTab";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import { createApplicableFeesBulk, deleteApplicableFee, getApplicableFee, listApplicableFees, listApplicableFeesBySection, listApplicableFeesByStudent, updateApplicableFee, type ApplicableFeePayload, type BulkApplicableFeePayload } from "@/src/lib/api/applicable-fees.api";
import { createFeeCategory, getFeeCategory, listFeeCategories, updateFeeCategory } from "@/src/lib/api/fee-categories.api";
import { listFeeStudents, type FeeStudent } from "@/src/lib/api/fee-reports.api";
import { createFeeType, getFeeType, listFeeTypes, updateFeeType, type FeeTypePayload } from "@/src/lib/api/fee-types.api";
import { generateInvoicesBulk, listPendingFeesByStudent, type BulkGenerateInvoicePayload, type SkippedFee } from "@/src/lib/api/invoices.api";
import { listSections } from "@/src/lib/api/sections.api";
import { listStudentsBySectionId } from "@/src/lib/api/students.api";
import type { ApplicableFee, FeeCategory, FeeType, Section, Student } from "@/src/lib/types";

const categoryId = (category: FeeCategory) => category.categoryId ?? category.CategoryId ?? "";
const categoryName = (category: FeeCategory) => category.categoryName ?? category.CategoryName ?? "";
const feeTypeId = (feeType: FeeType) => feeType.FeeTypeId ?? feeType.feeTypeId ?? "";
const feeTypeName = (feeType: FeeType) => feeType.Name ?? feeType.name ?? "";
const feeTypeCategoryId = (feeType: FeeType) => feeType.FeeCategoryId ?? feeType.feeCategoryId ?? "";
const feeTypeAcademicTerm = (feeType: FeeType) => feeType.AcademicTerm ?? feeType.academicTerm ?? feeType.Academic_Term ?? feeType.academic_term ?? "";
const applicableFeeType = (fee: ApplicableFee) => fee.feeType ?? fee.FeeType ?? null;
const applicableFeeName = (fee: ApplicableFee, feeType?: FeeType | null) => fee.FeeTypeName ?? fee.feeTypeName ?? feeTypeName(feeType ?? applicableFeeType(fee) ?? {});
const applicableFeeAmount = (fee: ApplicableFee, feeType?: FeeType | null) => fee.Amount ?? fee.amount ?? feeType?.Amount ?? feeType?.amount ?? 0;
const applicableFeeTerm = (fee: ApplicableFee, feeType?: FeeType | null) => fee.AcademicTerm ?? fee.academicTerm ?? fee.Academic_Term ?? fee.academic_term ?? feeTypeAcademicTerm(feeType ?? applicableFeeType(fee) ?? {});
const feeTypeDate = (feeType: FeeType) => (feeType.ApplicableDate ?? feeType.applicableDate ?? "").slice(0, 16);
const newFeeTypeForm = () => ({ FeeCategoryId: "", Name: "", Amount: "", Per: "month", AcademicTerm: "", Currency: "PKR", ApplicableDate: new Date().toISOString().slice(0, 16), IsActive: true });
const studentId = (student: Student) => student.StudentId ?? student.studentId ?? student.student_id ?? student.Id ?? student.id ?? "";
const studentName = (student: Student) => student.FullName ?? student.fullName ?? student.Email ?? student.email ?? "Student";
const applicableFeeId = (fee: ApplicableFee) => fee.AfId ?? fee.afId ?? "";
const comparableId = (value: string) => value.trim().toLowerCase();
const applicableFeePairKey = (studentIdValue: string, feeTypeIdValue: string) => JSON.stringify([comparableId(studentIdValue), comparableId(feeTypeIdValue)]);
const applicableFeeTypeIdFor = (fee: ApplicableFee, feeTypes: FeeType[]) => {
  const directId = fee.FeeTypeId ?? fee.feeTypeId;
  if (directId) return directId;
  const name = fee.FeeTypeName ?? fee.feeTypeName ?? "";
  return feeTypeId(feeTypes.find((feeType) => comparableId(feeTypeName(feeType)) === comparableId(name)) ?? {});
};
const applicableFeeStudentIdFor = (fee: ApplicableFee, students: Student[]) => {
  const directId = fee.StudentId ?? fee.studentId;
  if (directId) return directId;
  const name = fee.StudentName ?? fee.studentName ?? "";
  return studentId(students.find((student) => comparableId(studentName(student)) === comparableId(name)) ?? {});
};
const sectionId = (section: Section) => section.SectionId ?? section.sectionId ?? section.Id ?? section.id ?? "";
const sectionName = (section: Section) => section.Name ?? section.sectionName ?? "Unnamed section";
const applicableFeeStudentId = (fee: ApplicableFee) => fee.StudentId ?? fee.studentId ?? "";
const applicableFeeTypeId = (fee: ApplicableFee) => fee.FeeTypeId ?? fee.feeTypeId ?? "";
const newApplicableFeeForm = () => ({ StudentId: "", SectionId: "", FeeTypeIds: [] as string[] });
const newInvoiceForm = () => ({ StudentId: "", SectionId: "", FeeTypeIds: [] as string[], Month: new Date().toLocaleString("en-US", { month: "long" }), Year: String(new Date().getFullYear()), DueDate: new Date().toISOString().slice(0, 10) });
type ApplicableFeeForm = ReturnType<typeof newApplicableFeeForm>;
type InvoiceForm = ReturnType<typeof newInvoiceForm>;
type FeeTypeForm = ReturnType<typeof newFeeTypeForm>;
type FeeManagementTab = "categories" | "types" | "charged" | "generate" | "invoices" | "transactions" | "reports";

const TABS = [["invoices", "Invoices"], ["generate", "Generate invoice"], ["charged", "Apply fee"], ["types", "Fee types"], ["categories", "Fee categories"], ["transactions", "Transactions"], ["reports", "Reports"]] as const;

export function FeeManagement() {
  const { notify } = useNotifications();
  const [activeTab, setActiveTab] = useState<FeeManagementTab>("invoices");
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [applicableFees, setApplicableFees] = useState<ApplicableFee[]>([]);
  const [applicableFeeTargetMode, setApplicableFeeTargetMode] = useState<"student" | "section">("student");
  const [invoiceTargetMode, setInvoiceTargetMode] = useState<"student" | "section">("student");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feeTypeForm, setFeeTypeForm] = useState<FeeTypeForm>(newFeeTypeForm);
  const [editingFeeTypeId, setEditingFeeTypeId] = useState<string | null>(null);
  const [applicableFeeForm, setApplicableFeeForm] = useState<ApplicableFeeForm>(newApplicableFeeForm);
  const [editingApplicableFeeId, setEditingApplicableFeeId] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(newInvoiceForm);
  const [sectionApplicableFees, setSectionApplicableFees] = useState<ApplicableFee[]>([]);
  const [sectionStudents, setSectionStudents] = useState<Student[]>([]);
  const [sectionFeesLoading, setSectionFeesLoading] = useState(false);
  const [pendingFees, setPendingFees] = useState<ApplicableFee[]>([]);
  const [pendingFeesLoading, setPendingFeesLoading] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [skippedFees, setSkippedFees] = useState<SkippedFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoryData, feeTypeData, sectionData, studentData, applicableFeeData] = await Promise.all([listFeeCategories(), listFeeTypes(), listSections(), listFeeStudents(), listApplicableFees()]);
      setCategories(categoryData);
      setFeeTypes(feeTypeData);
      setSections(sectionData);
      setStudents(studentData as Student[]);
      setApplicableFees(applicableFeeData);
    } catch (error) {
      notify("error", "Fee data unavailable", error instanceof ApiError ? error.message : "Unable to load fee management data.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  const resetFeeTypeForm = () => {
    setFeeTypeForm(newFeeTypeForm());
    setEditingFeeTypeId(null);
  };

  const resetApplicableFeeForm = () => {
    setApplicableFeeForm(newApplicableFeeForm());
    setApplicableFeeTargetMode("student");
    setEditingApplicableFeeId(null);
  };

  const startEditing = async (id: string) => {
    try {
      const category = await getFeeCategory(id);
      setEditingId(id);
      setName(categoryName(category));
    } catch (error) {
      notify("error", "Fee category unavailable", error instanceof ApiError ? error.message : "Unable to load this fee category.");
    }
  };

  const startEditingFeeType = async (id: string) => {
    try {
      const feeType = await getFeeType(id);
      setEditingFeeTypeId(id);
      setFeeTypeForm({
        FeeCategoryId: feeTypeCategoryId(feeType),
        Name: feeTypeName(feeType),
        Amount: String(feeType.Amount ?? feeType.amount ?? ""),
        Per: feeType.Per ?? feeType.per ?? "month",
        AcademicTerm: feeType.AcademicTerm ?? feeType.academicTerm ?? "",
        Currency: feeType.Currency ?? feeType.currency ?? "PKR",
        ApplicableDate: feeTypeDate(feeType),
        IsActive: feeType.IsActive ?? feeType.isActive ?? true,
      });
    } catch (error) {
      notify("error", "Fee type unavailable", error instanceof ApiError ? error.message : "Unable to load this fee type.");
    }
  };

  const startEditingApplicableFee = async (id: string) => {
    try {
      const applicableFee = await getApplicableFee(id);
      setEditingApplicableFeeId(id);
      setApplicableFeeForm({ StudentId: applicableFeeStudentId(applicableFee), SectionId: "", FeeTypeIds: [applicableFeeTypeId(applicableFee)] });
    } catch (error) {
      notify("error", "Charged fee unavailable", error instanceof ApiError ? error.message : "Unable to load this charged fee.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      notify("error", "Validation failed", "Category name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateFeeCategory(editingId, { categoryName: trimmedName });
        notify("success", "Fee category updated", "The fee category was updated successfully.");
      } else {
        await createFeeCategory(trimmedName);
        notify("success", "Fee category created", "The fee category was created successfully.");
      }
      resetForm();
      await loadData();
    } catch (error) {
      notify("error", editingId ? "Update failed" : "Creation failed", error instanceof ApiError ? error.message : "Unable to save the fee category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeeTypeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(feeTypeForm.Amount);
    if (!feeTypeForm.FeeCategoryId || !feeTypeForm.Name.trim() || !Number.isFinite(amount) || amount <= 0 || !feeTypeForm.Per || !feeTypeForm.AcademicTerm.trim() || !feeTypeForm.Currency.trim() || !feeTypeForm.ApplicableDate) {
      notify("error", "Validation failed", "Complete all fee type fields with an amount above 0.");
      return;
    }

    const payload: FeeTypePayload = { ...feeTypeForm, Name: feeTypeForm.Name.trim(), Amount: amount, AcademicTerm: feeTypeForm.AcademicTerm.trim(), Currency: feeTypeForm.Currency.trim().toUpperCase(), ApplicableDate: `${feeTypeForm.ApplicableDate}:00` };
    setSubmitting(true);
    try {
      if (editingFeeTypeId) {
        await updateFeeType(editingFeeTypeId, payload);
        notify("success", "Fee type updated", "The fee type was updated successfully.");
      } else {
        await createFeeType(payload);
        notify("success", "Fee type created", "The fee type was created successfully.");
      }
      resetFeeTypeForm();
      await loadData();
    } catch (error) {
      notify("error", editingFeeTypeId ? "Update failed" : "Creation failed", error instanceof ApiError ? error.message : "Unable to save the fee type.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasSelectedTarget = (selectionMode: "student" | "section", selectedStudentId: string, selectedSectionId: string) => {
    if (selectionMode === "student") return Boolean(selectedStudentId);
    return Boolean(selectedSectionId);
  };

  const getTargetStudentIds = async (selectionMode: "student" | "section", selectedStudentId: string, selectedSectionId: string) => {
    if (selectionMode === "student") {
      return selectedStudentId ? [selectedStudentId] : [];
    }

    if (!selectedSectionId) return [];
    const sectionStudents = await listStudentsBySectionId(selectedSectionId);
    return [...new Set(sectionStudents.map(studentId).filter(Boolean))];
  };

  const handleApplicableFeeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingApplicableFeeId) {
      if (!applicableFeeForm.StudentId || !applicableFeeForm.FeeTypeIds.length) {
        notify("error", "Validation failed", "Select a student and at least one fee type.");
        return;
      }
      const duplicate = applicableFees.some((fee) =>
        comparableId(applicableFeeId(fee)) !== comparableId(editingApplicableFeeId)
        && applicableFeePairKey(applicableFeeStudentIdFor(fee, students), applicableFeeTypeIdFor(fee, feeTypes)) === applicableFeePairKey(applicableFeeForm.StudentId, applicableFeeForm.FeeTypeIds[0]),
      );
      if (duplicate) {
        notify("error", "Fee already assigned", "This fee type is already assigned to this student.");
        return;
      }
    } else {
      const selectedTarget = hasSelectedTarget(applicableFeeTargetMode, applicableFeeForm.StudentId, applicableFeeForm.SectionId);
      const targetStudentIds = await getTargetStudentIds(applicableFeeTargetMode, applicableFeeForm.StudentId, applicableFeeForm.SectionId);
      if (!selectedTarget) {
        notify("error", "Validation failed", "Select a target and at least one fee type to apply.");
        return;
      }
      if (targetStudentIds.length === 0) {
        notify("error", "Validation failed", "No students were found in the selected section.");
        return;
      }
      if (applicableFeeForm.FeeTypeIds.length === 0) {
        notify("error", "Validation failed", "Select at least one fee type to apply.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editingApplicableFeeId) {
        const payload: ApplicableFeePayload = { StudentId: applicableFeeForm.StudentId, FeeTypeId: applicableFeeForm.FeeTypeIds[0] };
        await updateApplicableFee(editingApplicableFeeId, payload);
        notify("success", "Charged fee updated", "The student's charged fee was updated successfully.");
      } else {
        const targetStudentIds = await getTargetStudentIds(applicableFeeTargetMode, applicableFeeForm.StudentId, applicableFeeForm.SectionId);
        const requestedItems: BulkApplicableFeePayload = targetStudentIds.flatMap((studentIdValue) => applicableFeeForm.FeeTypeIds.map((feeTypeIdValue) => ({ StudentId: studentIdValue, FeeTypeId: feeTypeIdValue })));
        let currentAssignments: ApplicableFee[];
        try {
          currentAssignments = applicableFeeTargetMode === "section"
            ? await listApplicableFeesBySection(applicableFeeForm.SectionId)
            : await listApplicableFeesByStudent(applicableFeeForm.StudentId);
        } catch (error) {
          if (error instanceof ApiError && /no applicable fees found/i.test(error.message)) {
            currentAssignments = [];
          } else {
            throw error;
          }
        }
        const existingPairs = new Set(currentAssignments.map((fee) => {
          const assignedStudentId = applicableFeeStudentIdFor(fee, students) || (applicableFeeTargetMode === "student" ? applicableFeeForm.StudentId : "");
          return applicableFeePairKey(assignedStudentId, applicableFeeTypeIdFor(fee, feeTypes));
        }));
        const submittedPairs = new Set<string>();
        const payload = requestedItems.filter((item) => {
          const key = applicableFeePairKey(item.StudentId, item.FeeTypeId);
          if (existingPairs.has(key) || submittedPairs.has(key)) return false;
          submittedPairs.add(key);
          return true;
        });
        const skippedCount = requestedItems.length - payload.length;
        if (payload.length === 0) {
          notify("error", "Fees already charged", "The selected fee types are already assigned to all targeted students.");
          return;
        }
        const result = await createApplicableFeesBulk(payload);
        const skippedTotal = skippedCount + result.skipped.length;
        notify(result.created > 0 ? "success" : "error", "Fees charged", `Applied ${result.created} student-fee assignments${skippedTotal ? `; skipped ${skippedTotal}${result.skipped[0] ? ` (${result.skipped[0].reason})` : ""}.` : "."}`);
      }
      resetApplicableFeeForm();
      await loadData();
    } catch (error) {
      notify("error", editingApplicableFeeId ? "Update failed" : "Charge failed", error instanceof ApiError ? error.message : "Unable to save the charged fee.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveApplicableFee = async (id: string) => {
    if (!window.confirm("Remove this fee from the student?")) return;
    try {
      await deleteApplicableFee(id);
      notify("success", "Fee removed", "The fee is no longer applied to this student.");
      await loadData();
    } catch (error) {
      notify("error", "Removal failed", error instanceof ApiError ? error.message : "Unable to remove this fee.");
    }
  };

  const handleGenerateInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedTarget = hasSelectedTarget(invoiceTargetMode, invoiceForm.StudentId, invoiceForm.SectionId);
    if (!selectedTarget) {
      notify("error", "Validation failed", "Select a target, at least one fee type, month, year, and due date.");
      return;
    }
    if (invoiceForm.FeeTypeIds.length === 0 || !invoiceForm.Month.trim() || !invoiceForm.Year.trim() || !invoiceForm.DueDate) {
      notify("error", "Validation failed", "Select at least one fee type, month, year, and due date.");
      return;
    }

    const fees = invoiceTargetMode === "student"
      ? invoiceForm.FeeTypeIds.map((feeTypeIdValue) => ({ StudentId: invoiceForm.StudentId, FeeTypeId: feeTypeIdValue }))
      : sectionApplicableFees
          .filter((fee) => invoiceForm.FeeTypeIds.includes(applicableFeeTypeIdFor(fee, feeTypes)))
          .map((fee) => ({
            StudentId: applicableFeeStudentIdFor(fee, sectionStudents),
            FeeTypeId: applicableFeeTypeIdFor(fee, feeTypes),
          }))
          .filter((fee) => Boolean(fee.StudentId && fee.FeeTypeId))
          .filter((fee, index, allFees) => allFees.findIndex((item) => comparableId(item.StudentId) === comparableId(fee.StudentId) && comparableId(item.FeeTypeId) === comparableId(fee.FeeTypeId)) === index);

    if (fees.length === 0) {
      notify("error", "Validation failed", "No selected charged fees could be matched to a student.");
      return;
    }

    const payload: BulkGenerateInvoicePayload = {
      fees,
      month: invoiceForm.Month.trim(),
      year: invoiceForm.Year.trim(),
      dueDate: `${invoiceForm.DueDate}T00:00:00`,
    };
    setGeneratingInvoice(true);
    setSkippedFees([]);
    try {
      const { created, skipped } = await generateInvoicesBulk(payload);
      setSkippedFees(skipped);
      notify(created.length > 0 ? "success" : "error", "Invoices generated", `${created.length} invoice${created.length === 1 ? "" : "s"} generated${skipped.length ? `, ${skipped.length} skipped` : ""}.`);
      if (skipped.length === 0) {
        setInvoiceForm(newInvoiceForm());
        setPendingFees([]);
      }
    } catch (error) {
      notify("error", "Invoice generation failed", error instanceof ApiError ? error.message : "Unable to generate the invoice.");
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleInvoiceStudentChange = async (studentIdValue: string) => {
    setInvoiceForm((current) => ({ ...current, StudentId: studentIdValue, SectionId: "", FeeTypeIds: [] }));
    setPendingFees([]);
    setSectionApplicableFees([]);
    setSectionStudents([]);
    if (!studentIdValue) return;

    setPendingFeesLoading(true);
    try {
      setPendingFees(await listPendingFeesByStudent(studentIdValue));
    } catch (error) {
      notify("error", "Pending fees unavailable", error instanceof ApiError ? error.message : "Unable to load pending fees for this student.");
    } finally {
      setPendingFeesLoading(false);
    }
  };

  const sectionOptions = useMemo(() => sections.map((section) => ({ id: sectionId(section), name: sectionName(section) })), [sections]);
  const invoiceSelectableFees = invoiceTargetMode === "student"
    ? pendingFees
    : [...new Map(sectionApplicableFees.map((fee) => [applicableFeeTypeIdFor(fee, feeTypes) || comparableId(applicableFeeName(fee)), fee])).values()];

  return (
    <>
      <div className="mb-3 overflow-x-auto border-b border-black/10"><div className="flex min-w-max gap-1" role="tablist" aria-label="Fee management sections">{TABS.map(([tab, label]) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={`border-b-2 px-3 py-1.5 text-sm font-medium transition ${activeTab === tab ? "theme-border-primary theme-text-primary" : "border-transparent theme-text-muted hover:theme-text"}`} onClick={() => setActiveTab(tab)}>{label}</button>)}</div></div>
        {activeTab === "categories" ? <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <Card>
            <h2 className="mb-2.5 text-lg font-semibold theme-text">Fee categories</h2>
            {loading ? <div className="text-sm theme-text-muted">Loading fee categories...</div> : categories.length === 0 ? <p className="py-8 text-sm theme-text-muted">No fee categories found.</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-black/10"><tr><th className="px-2.5 py-1.5 theme-text-muted">Category name</th><th className="px-2.5 py-1.5 text-right theme-text-muted">Actions</th></tr></thead>
                  <tbody>{categories.map((category) => { const id = categoryId(category); return <tr key={id} className="border-b border-black/5"><td className="px-2.5 py-1.5">{categoryName(category)}</td><td className="px-2.5 py-1.5 text-right"><button type="button" className="theme-text-primary underline" onClick={() => void startEditing(id)}>Edit</button></td></tr>; })}</tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-2.5 text-lg font-semibold theme-text">{editingId ? "Edit category" : "Add category"}</h2>
            <form className="space-y-2.5" onSubmit={handleSubmit} noValidate>
              <Input label="Category name" placeholder="Tuition fee" value={name} onChange={(event) => setName(event.target.value)} disabled={submitting} />
              <div className="flex justify-end gap-3">
                {editingId ? <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button> : null}
                <Button type="submit" loading={submitting}>{submitting ? "Saving..." : editingId ? "Save changes" : "Create category"}</Button>
              </div>
            </form>
          </Card>
        </div> : null}
        {activeTab === "types" ? <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <Card>
            <h2 className="mb-2.5 text-lg font-semibold theme-text">Fee types</h2>
            {loading ? <div className="text-sm theme-text-muted">Loading fee types...</div> : feeTypes.length === 0 ? <p className="py-8 text-sm theme-text-muted">No fee types found.</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-black/10"><tr><th className="px-2.5 py-1.5 theme-text-muted">Name</th><th className="px-2.5 py-1.5 theme-text-muted">Category</th><th className="px-2.5 py-1.5 theme-text-muted">Amount</th><th className="px-2.5 py-1.5 theme-text-muted">Term</th><th className="px-2.5 py-1.5 theme-text-muted">Status</th><th className="px-2.5 py-1.5 text-right theme-text-muted">Actions</th></tr></thead>
                  <tbody>{feeTypes.map((feeType) => { const id = feeTypeId(feeType); const selectedCategory = categories.find((category) => categoryId(category) === feeTypeCategoryId(feeType)); const active = feeType.IsActive ?? feeType.isActive ?? true; return <tr key={id} className="border-b border-black/5"><td className="px-2.5 py-1.5">{feeTypeName(feeType)}</td><td className="px-2.5 py-1.5">{selectedCategory ? categoryName(selectedCategory) : "Unknown category"}</td><td className="px-2.5 py-1.5">{feeType.Currency ?? feeType.currency ?? "PKR"} {feeType.Amount ?? feeType.amount ?? 0}</td><td className="px-2.5 py-1.5">{feeType.Per ?? feeType.per ?? "-"}</td><td className="px-2.5 py-1.5">{active ? "Active" : "Inactive"}</td><td className="px-2.5 py-1.5 text-right"><button type="button" className="theme-text-primary underline" onClick={() => void startEditingFeeType(id)}>Edit</button></td></tr>; })}</tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-2.5 text-lg font-semibold theme-text">{editingFeeTypeId ? "Edit fee type" : "Add fee type"}</h2>
            <form className="space-y-2.5" onSubmit={handleFeeTypeSubmit} noValidate>
              <Select label="Fee category" value={feeTypeForm.FeeCategoryId} onChange={(event) => setFeeTypeForm((current) => ({ ...current, FeeCategoryId: event.target.value }))} disabled={submitting}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={categoryId(category)} value={categoryId(category)}>{categoryName(category)}</option>)}
              </Select>
              <Input label="Name" placeholder="Examination Fee" value={feeTypeForm.Name} onChange={(event) => setFeeTypeForm((current) => ({ ...current, Name: event.target.value }))} disabled={submitting} />
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Input label="Amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={feeTypeForm.Amount} onChange={(event) => setFeeTypeForm((current) => ({ ...current, Amount: event.target.value }))} disabled={submitting} />
                <Select label="Per" value={feeTypeForm.Per} onChange={(event) => setFeeTypeForm((current) => ({ ...current, Per: event.target.value }))} disabled={submitting}><option value="month">Month</option><option value="year">Year</option><option value="one-time">One-time</option></Select>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Input label="Academic term" placeholder="Fall-2026" value={feeTypeForm.AcademicTerm} onChange={(event) => setFeeTypeForm((current) => ({ ...current, AcademicTerm: event.target.value }))} disabled={submitting} />
                <Input label="Currency" placeholder="PKR" value={feeTypeForm.Currency} onChange={(event) => setFeeTypeForm((current) => ({ ...current, Currency: event.target.value }))} disabled={submitting} />
              </div>
              <Input label="Applicable date" type="datetime-local" value={feeTypeForm.ApplicableDate} onChange={(event) => setFeeTypeForm((current) => ({ ...current, ApplicableDate: event.target.value }))} disabled={submitting} />
              <label className="flex items-center gap-3 text-sm theme-text-soft"><input type="checkbox" checked={feeTypeForm.IsActive} onChange={(event) => setFeeTypeForm((current) => ({ ...current, IsActive: event.target.checked }))} disabled={submitting} />Active fee type</label>
              <div className="flex justify-end gap-3">
                {editingFeeTypeId ? <Button type="button" variant="ghost" onClick={resetFeeTypeForm}>Cancel</Button> : null}
                <Button type="submit" loading={submitting}>{submitting ? "Saving..." : editingFeeTypeId ? "Save changes" : "Create fee type"}</Button>
              </div>
            </form>
          </Card>
        </div> : null}
        {activeTab === "charged" ? <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <Card>
            <h2 className="mb-2.5 text-lg font-semibold theme-text">Charged fees</h2>
            {loading ? <div className="text-sm theme-text-muted">Loading charged fees...</div> : applicableFees.length === 0 ? <p className="py-8 text-sm theme-text-muted">No fees have been charged yet.</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-black/10"><tr><th className="px-2.5 py-1.5 theme-text-muted">Student</th><th className="px-2.5 py-1.5 theme-text-muted">Fee</th><th className="px-2.5 py-1.5 theme-text-muted">Amount</th><th className="px-2.5 py-1.5 theme-text-muted">Term</th><th className="px-2.5 py-1.5 theme-text-muted">Status</th><th className="px-2.5 py-1.5 text-right theme-text-muted">Actions</th></tr></thead>
                  <tbody>{applicableFees.map((fee) => {
                    const id = applicableFeeId(fee);
                    const student = students.find((item) => comparableId(studentId(item)) === comparableId(applicableFeeStudentId(fee)));
                    const feeType = feeTypes.find((item) => comparableId(feeTypeId(item)) === comparableId(applicableFeeTypeId(fee))) ?? applicableFeeType(fee);
                    const activeStatus = fee.Status ?? fee.status;
                    return <tr key={id} className="border-b border-black/5"><td className="px-2.5 py-1.5">{fee.StudentName ?? fee.studentName ?? (student ? studentName(student) : "Unknown student")}</td><td className="px-2.5 py-1.5">{applicableFeeName(fee, feeType)}</td><td className="px-2.5 py-1.5">{applicableFeeAmount(fee, feeType)}</td><td className="px-2.5 py-1.5">{applicableFeeTerm(fee, feeType) || "-"}</td><td className="px-2.5 py-1.5">{activeStatus ?? "Charged"}</td><td className="px-2.5 py-1.5 text-right"><div className="flex justify-end gap-2"><button type="button" className="theme-text-primary underline" onClick={() => void startEditingApplicableFee(id)}>Edit</button><button type="button" className="text-red-700 underline" onClick={() => void handleRemoveApplicableFee(id)}>Remove</button></div></td></tr>;
                  })}</tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-2.5 text-lg font-semibold theme-text">{editingApplicableFeeId ? "Edit charged fee" : "Apply bulk fee"}</h2>
            <form className="space-y-2.5" onSubmit={handleApplicableFeeSubmit} noValidate>
              <Select label="Apply to" value={applicableFeeTargetMode} onChange={(event) => {
                setApplicableFeeTargetMode(event.target.value as "student" | "section");
                setApplicableFeeForm((current) => ({ ...current, StudentId: "", SectionId: "", FeeTypeIds: [] }));
              }} disabled={submitting}>
                <option value="student">Single student</option>
                <option value="section">Specific section</option>
              </Select>
              {applicableFeeTargetMode === "student" ? <Select label="Student" value={applicableFeeForm.StudentId} onChange={(event) => setApplicableFeeForm((current) => ({ ...current, StudentId: event.target.value }))} disabled={submitting}>
                <option value="">Select student</option>
                {students.map((student) => <option key={studentId(student)} value={studentId(student)}>{studentName(student)}</option>)}
              </Select> : null}
              {applicableFeeTargetMode === "section" ? <Select label="Section" value={applicableFeeForm.SectionId} onChange={(event) => setApplicableFeeForm((current) => ({ ...current, SectionId: event.target.value }))} disabled={submitting}>
                <option value="">Select section</option>
                {sections.map((section) => <option key={sectionId(section)} value={sectionId(section)}>{sectionName(section)}</option>)}
              </Select> : null}
              <div className="space-y-2">
                <p className="text-sm font-medium theme-text-soft">Fee types</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {feeTypes.filter((feeType) => feeType.IsActive ?? feeType.isActive ?? true).map((feeType) => {
                    const id = feeTypeId(feeType);
                    const checked = applicableFeeForm.FeeTypeIds.includes(id);
                    return <label key={id} className="flex items-center gap-3 rounded-lg border border-black/10 theme-bg-input p-3 text-sm theme-text"><input type="checkbox" checked={checked} onChange={(event) => setApplicableFeeForm((current) => ({ ...current, FeeTypeIds: event.target.checked ? [...current.FeeTypeIds, id] : current.FeeTypeIds.filter((item) => item !== id) }))} disabled={submitting} />{feeTypeName(feeType)} - {feeType.Amount ?? feeType.amount ?? 0} {feeType.Currency ?? feeType.currency ?? "PKR"}</label>;
                  })}
                </div>
              </div>
              <p className="text-xs theme-text-muted">This can apply one or many fee types to one student or every student in a section.</p>
              <div className="flex justify-end gap-3">
                {editingApplicableFeeId ? <Button type="button" variant="ghost" onClick={resetApplicableFeeForm}>Cancel</Button> : null}
                <Button type="submit" loading={submitting}>{submitting ? "Saving..." : editingApplicableFeeId ? "Save changes" : "Apply fee"}</Button>
              </div>
            </form>
          </Card>
        </div> : null}
        {activeTab === "generate" ? <Card className="mt-3">
          <h2 className="mb-2.5 text-lg font-semibold theme-text">Generate invoice</h2>
          <form className="space-y-2.5" onSubmit={handleGenerateInvoice} noValidate>
            <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-4">
              <Select label="Target type" value={invoiceTargetMode} onChange={(event) => {
                const nextMode = event.target.value as "student" | "section";
                setInvoiceTargetMode(nextMode);
                setInvoiceForm((current) => ({ ...current, StudentId: "", SectionId: "", FeeTypeIds: [] }));
                setSectionApplicableFees([]);
                setSectionStudents([]);
                setPendingFees([]);
              }} disabled={generatingInvoice}>
                <option value="student">Single student</option>
                <option value="section">Specific section</option>
              </Select>
              {invoiceTargetMode === "student" ? <Select label="Student" value={invoiceForm.StudentId} onChange={(event) => { setInvoiceForm((current) => ({ ...current, StudentId: event.target.value })); void handleInvoiceStudentChange(event.target.value); }} disabled={generatingInvoice || pendingFeesLoading}>
                <option value="">Select student</option>
                {students.map((student) => <option key={studentId(student)} value={studentId(student)}>{studentName(student)}</option>)}
              </Select> : null}
              {invoiceTargetMode === "section" ? <Select label="Section" value={invoiceForm.SectionId} onChange={async (event) => {
                const nextSectionId = event.target.value;
                setInvoiceForm((current) => ({ ...current, SectionId: nextSectionId, StudentId: "", FeeTypeIds: [] }));
                setSectionApplicableFees([]);
                setSectionStudents([]);
                if (!nextSectionId) return;
                setSectionFeesLoading(true);
                try {
                  const [sectionFees, sectionStudentData] = await Promise.all([
                    listApplicableFeesBySection(nextSectionId),
                    listStudentsBySectionId(nextSectionId),
                  ]);
                  setSectionApplicableFees(sectionFees);
                  setSectionStudents(sectionStudentData);
                } catch (error) {
                  notify("error", "Section fees unavailable", error instanceof ApiError ? error.message : "Unable to load charged fees for this section.");
                } finally {
                  setSectionFeesLoading(false);
                }
              }} disabled={generatingInvoice}>
                <option value="">Select section</option>
                {sections.map((section) => <option key={sectionId(section)} value={sectionId(section)}>{sectionName(section)}</option>)}
              </Select> : null}
              <Select label="Month" value={invoiceForm.Month} onChange={(event) => setInvoiceForm((current) => ({ ...current, Month: event.target.value }))} disabled={generatingInvoice}>
                {(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const).map((month) => <option key={month} value={month}>{month}</option>)}
              </Select>
              <Input label="Year" placeholder="2026" value={invoiceForm.Year} onChange={(event) => setInvoiceForm((current) => ({ ...current, Year: event.target.value }))} disabled={generatingInvoice} />
              <Input label="Due date" type="date" value={invoiceForm.DueDate} onChange={(event) => setInvoiceForm((current) => ({ ...current, DueDate: event.target.value }))} disabled={generatingInvoice} />
            </div>
            <fieldset disabled={generatingInvoice}>
              <legend className="mb-2 block text-sm theme-text-soft">Charged fees to include</legend>
              {invoiceTargetMode === "student" && !invoiceForm.StudentId ? <p className="text-sm theme-text-muted">Select a student to see pending fees.</p> : invoiceTargetMode === "section" && !invoiceForm.SectionId ? <p className="text-sm theme-text-muted">Select a section to see its charged fees.</p> : pendingFeesLoading || sectionFeesLoading ? <p className="text-sm theme-text-muted">Loading charged fees...</p> : invoiceSelectableFees.length === 0 ? <p className="text-sm theme-text-muted">No charged fees are available for the selected target.</p> : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{invoiceSelectableFees.map((fee) => { const id = applicableFeeId(fee); const feeType = feeTypes.find((item) => comparableId(feeTypeName(item)) === comparableId(applicableFeeName(fee))) ?? applicableFeeType(fee); const typeId = applicableFeeTypeId(fee) || feeTypeId(feeType ?? {}); return <label key={id || `${typeId}-${applicableFeeName(fee)}`} className="flex items-center gap-3 rounded-lg border border-black/10 theme-bg-input p-3 text-sm theme-text"><input type="checkbox" checked={invoiceForm.FeeTypeIds.includes(typeId)} disabled={!typeId} onChange={(event) => setInvoiceForm((current) => ({ ...current, FeeTypeIds: event.target.checked ? [...current.FeeTypeIds, typeId] : current.FeeTypeIds.filter((item) => item !== typeId) }))} />{applicableFeeName(fee, feeType)} - {applicableFeeAmount(fee, feeType)} {feeType?.Currency ?? feeType?.currency ?? "PKR"}</label>; })}</div>}
            </fieldset>
            {skippedFees.length > 0 ? <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800"><p className="mb-1 font-medium">{skippedFees.length} skipped</p><ul className="space-y-0.5">{skippedFees.map((item) => <li key={`${item.studentId}-${item.fee}`}>{item.student}, {item.fee}: {item.reason}</li>)}</ul></div> : null}
            <div className="flex justify-end"><Button type="submit" loading={generatingInvoice}>{generatingInvoice ? "Generating..." : "Generate invoice"}</Button></div>
          </form>
        </Card> : null}
        {activeTab === "invoices" ? <InvoicesTab sections={sectionOptions} /> : null}
        {activeTab === "transactions" ? <TransactionsTab /> : null}
        {activeTab === "reports" ? <ReportsTab sections={sectionOptions} students={students as FeeStudent[]} /> : null}
    </>
  );
}
