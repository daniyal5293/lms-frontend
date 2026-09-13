"use client";

import { useCallback, useEffect, useState } from "react";
import { Document, Page, PDFDownloadLink, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import { createApplicableFee, getApplicableFee, listApplicableFees, updateApplicableFee, type ApplicableFeePayload } from "@/src/lib/api/applicable-fees.api";
import { createFeeCategory, getFeeCategory, listFeeCategories, updateFeeCategory } from "@/src/lib/api/fee-categories.api";
import { createFeeType, getFeeType, listFeeTypes, updateFeeType, type FeeTypePayload } from "@/src/lib/api/fee-types.api";
import { generateInvoice, listInvoiceHistoryByStudent, listPendingFeesByStudent, type GenerateInvoicePayload } from "@/src/lib/api/invoices.api";
import { listStudents } from "@/src/lib/api/students.api";
import type { ApplicableFee, FeeCategory, FeeType, Invoice, Student } from "@/src/lib/types";

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
const invoiceNumber = (invoice: Invoice) => invoice.invoiceNum ?? invoice.InvoiceNum ?? "-";
const invoiceFeeName = (invoice: Invoice) => invoice.feeTypeName ?? invoice.FeeTypeName ?? "-";
const invoiceAmount = (invoice: Invoice) => invoice.amount ?? invoice.Amount ?? 0;
const invoiceAmountDue = (invoice: Invoice) => invoice.amountDue ?? invoice.AmountDue ?? invoiceAmount(invoice);
const invoiceDate = (value?: string) => value ? new Date(value).toLocaleDateString() : "-";
const applicableFeeId = (fee: ApplicableFee) => fee.AfId ?? fee.afId ?? "";
const comparableId = (value: string) => value.trim().toLowerCase();
const applicableFeeStudentId = (fee: ApplicableFee) => fee.StudentId ?? fee.studentId ?? "";
const applicableFeeTypeId = (fee: ApplicableFee) => fee.FeeTypeId ?? fee.feeTypeId ?? "";
const newApplicableFeeForm = () => ({ StudentId: "", FeeTypeId: "" });
const newInvoiceForm = () => ({ StudentId: "", FeeTypeIds: [] as string[], Month: new Date().toLocaleString("en-US", { month: "long" }), Year: String(new Date().getFullYear()), DueDate: new Date().toISOString().slice(0, 16) });
type ApplicableFeeForm = ReturnType<typeof newApplicableFeeForm>;
type InvoiceForm = ReturnType<typeof newInvoiceForm>;
type FeeTypeForm = ReturnType<typeof newFeeTypeForm>;

const invoicePdfStyles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", color: "#1f2937", fontSize: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: "2 solid #0f766e", paddingBottom: 16, marginBottom: 24 },
  brand: { fontSize: 20, fontWeight: 700, color: "#0f766e" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#64748b" },
  summary: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  table: { border: "1 solid #cbd5e1" },
  row: { flexDirection: "row", borderBottom: "1 solid #e2e8f0", minHeight: 28, alignItems: "center" },
  headerRow: { backgroundColor: "#f0fdfa", fontWeight: 700 },
  cell: { padding: 7 },
  invoiceCell: { width: "19%" },
  feeCell: { width: "31%" },
  amountCell: { width: "16%", textAlign: "right" },
  periodCell: { width: "18%" },
  forCell: { width: "20%" },
  footer: { marginTop: 28, borderTop: "1 solid #cbd5e1", paddingTop: 12, color: "#64748b" },
});

function InvoicePdfDocument({ invoices, student }: { invoices: Invoice[]; student: Student }) {
  const currency = invoices[0]?.currency ?? invoices[0]?.Currency ?? "PKR";
  const total = invoices.reduce((sum, invoice) => sum + invoiceAmount(invoice), 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + (invoice.amountPaid ?? invoice.AmountPaid ?? 0), 0);
  const totalDue = invoices.reduce((sum, invoice) => sum + invoiceAmountDue(invoice), 0);
  const section = student.Section?.Name ?? student.Section?.sectionName ?? "-";

  return <Document title={`Invoice - ${studentName(student)}`} author="LMS Portal"><Page size="A4" style={invoicePdfStyles.page}><View style={invoicePdfStyles.header}><View><Text style={invoicePdfStyles.brand}>LMS Portal</Text><Text style={invoicePdfStyles.muted}>Student invoice</Text></View><View><Text style={invoicePdfStyles.title}>Invoice</Text><Text style={invoicePdfStyles.muted}>{invoiceNumber(invoices[0])}</Text></View></View><View style={invoicePdfStyles.summary}><View><Text style={invoicePdfStyles.title}>Student details</Text><Text>{studentName(student)}</Text><Text style={invoicePdfStyles.muted}>Section: {section}</Text></View><View><Text style={invoicePdfStyles.title}>Invoice details</Text><Text>For: {invoices[0]?.month ?? invoices[0]?.Month ?? "-"} {invoices[0]?.year ?? invoices[0]?.Year ?? ""}</Text><Text>Due date: {invoiceDate(invoices[0]?.dueDate ?? invoices[0]?.DueDate)}</Text><Text>Total: {currency} {total.toFixed(2)}</Text><Text>Amount due: {currency} {totalDue.toFixed(2)}</Text></View></View><View style={invoicePdfStyles.table}><View style={[invoicePdfStyles.row, invoicePdfStyles.headerRow]}><Text style={[invoicePdfStyles.cell, invoicePdfStyles.feeCell]}>Fee</Text><Text style={[invoicePdfStyles.cell, invoicePdfStyles.amountCell]}>Amount</Text><Text style={[invoicePdfStyles.cell, invoicePdfStyles.forCell]}>For</Text></View>{invoices.map((invoice, index) => <View key={`${invoiceNumber(invoice)}-${invoice.id ?? invoice.Id ?? index}`} style={invoicePdfStyles.row}><Text style={[invoicePdfStyles.cell, invoicePdfStyles.feeCell]}>{invoiceFeeName(invoice)}</Text><Text style={[invoicePdfStyles.cell, invoicePdfStyles.amountCell]}>{currency} {invoiceAmount(invoice).toFixed(2)}</Text><Text style={[invoicePdfStyles.cell, invoicePdfStyles.forCell]}>{invoice.month ?? invoice.Month ?? "-"} {invoice.year ?? invoice.Year ?? ""}</Text></View>)}</View><View style={invoicePdfStyles.footer}><Text>Total amount: {currency} {total.toFixed(2)}</Text><Text>Paid: {currency} {totalPaid.toFixed(2)} | Balance due: {currency} {totalDue.toFixed(2)}</Text><Text>Generated on {new Date().toLocaleDateString()} | Amounts are shown in {currency}.</Text></View></Page></Document>;
}

export default function FeeManagementPage() {
  const { notify } = useNotifications();
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [applicableFees, setApplicableFees] = useState<ApplicableFee[]>([]);
  const [pendingFees, setPendingFees] = useState<ApplicableFee[]>([]);
  const [pendingFeesLoading, setPendingFeesLoading] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feeTypeForm, setFeeTypeForm] = useState<FeeTypeForm>(newFeeTypeForm);
  const [editingFeeTypeId, setEditingFeeTypeId] = useState<string | null>(null);
  const [applicableFeeForm, setApplicableFeeForm] = useState<ApplicableFeeForm>(newApplicableFeeForm);
  const [editingApplicableFeeId, setEditingApplicableFeeId] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(newInvoiceForm);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState<Invoice[]>([]);
  const [invoiceHistoryStudentId, setInvoiceHistoryStudentId] = useState("");
  const [invoiceHistoryLoading, setInvoiceHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoryData, feeTypeData, studentData, applicableFeeData] = await Promise.all([listFeeCategories(), listFeeTypes(), listStudents(), listApplicableFees()]);
      setCategories(categoryData);
      setFeeTypes(feeTypeData);
      setStudents(studentData);
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
      setApplicableFeeForm({ StudentId: applicableFeeStudentId(applicableFee), FeeTypeId: applicableFeeTypeId(applicableFee) });
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
    if (!feeTypeForm.FeeCategoryId || !feeTypeForm.Name.trim() || !Number.isFinite(amount) || amount < 0 || !feeTypeForm.Per || !feeTypeForm.AcademicTerm.trim() || !feeTypeForm.Currency.trim() || !feeTypeForm.ApplicableDate) {
      notify("error", "Validation failed", "Complete all fee type fields with a valid non-negative amount.");
      return;
    }

    const payload: FeeTypePayload = { ...feeTypeForm, Name: feeTypeForm.Name.trim(), Amount: amount, AcademicTerm: feeTypeForm.AcademicTerm.trim(), Currency: feeTypeForm.Currency.trim(), ApplicableDate: `${feeTypeForm.ApplicableDate}:00` };
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

  const handleApplicableFeeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!applicableFeeForm.StudentId || !applicableFeeForm.FeeTypeId) {
      notify("error", "Validation failed", "Select a student and fee type.");
      return;
    }

    const payload: ApplicableFeePayload = applicableFeeForm;
    setSubmitting(true);
    try {
      if (editingApplicableFeeId) {
        await updateApplicableFee(editingApplicableFeeId, payload);
        notify("success", "Charged fee updated", "The student's charged fee was updated successfully.");
      } else {
        await createApplicableFee(payload);
        notify("success", "Fee charged", "The fee was charged to the student successfully.");
      }
      resetApplicableFeeForm();
      await loadData();
    } catch (error) {
      notify("error", editingApplicableFeeId ? "Update failed" : "Charge failed", error instanceof ApiError ? error.message : "Unable to save the charged fee.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoiceForm.StudentId || invoiceForm.FeeTypeIds.length === 0 || !invoiceForm.Month.trim() || !invoiceForm.Year.trim() || !invoiceForm.DueDate) {
      notify("error", "Validation failed", "Select a student, at least one charged fee, month, year, and due date.");
      return;
    }

    const payload: GenerateInvoicePayload = {
      fees: invoiceForm.FeeTypeIds.map((feeTypeId) => ({ studentId: invoiceForm.StudentId, feeTypeId })),
      month: invoiceForm.Month.trim(),
      year: invoiceForm.Year.trim(),
      dueDate: new Date(invoiceForm.DueDate).toISOString(),
    };
    setGeneratingInvoice(true);
    try {
      const invoices = await generateInvoice(payload);
      const invoiceNumber = invoices[0]?.invoiceNum ?? invoices[0]?.InvoiceNum;
      notify("success", "Invoice generated", invoiceNumber ? `Invoice ${invoiceNumber} was generated successfully.` : "The invoice was generated successfully.");
      setInvoiceForm(newInvoiceForm());
    } catch (error) {
      notify("error", "Invoice generation failed", error instanceof ApiError ? error.message : "Unable to generate the invoice.");
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleInvoiceStudentChange = async (studentIdValue: string) => {
    setInvoiceForm((current) => ({ ...current, StudentId: studentIdValue, FeeTypeIds: [] }));
    setPendingFees([]);
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

  const handleInvoiceHistoryStudentChange = async (studentIdValue: string) => {
    setInvoiceHistoryStudentId(studentIdValue);
    setInvoiceHistory([]);
    if (!studentIdValue) return;

    setInvoiceHistoryLoading(true);
    try {
      setInvoiceHistory(await listInvoiceHistoryByStudent(studentIdValue));
    } catch (error) {
      notify("error", "Invoice history unavailable", error instanceof ApiError ? error.message : "Unable to load this student's invoice history.");
    } finally {
      setInvoiceHistoryLoading(false);
    }
  };

  const invoiceGroups = Array.from(
    invoiceHistory.reduce((groups, invoice) => {
      const key = invoiceNumber(invoice);
      const group = groups.get(key) ?? [];
      group.push(invoice);
      groups.set(key, group);
      return groups;
    }, new Map<string, Invoice[]>()),
  );

  return (
    <ProtectedRoute allowedRoles={["HOD"]}>
      <AppShell>
        <PageHeader title="Fee Management" description="Manage the fee categories used by the institution." />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <Card>
            <h2 className="mb-4 text-lg font-semibold theme-text">Fee categories</h2>
            {loading ? <div className="text-sm theme-text-muted">Loading fee categories...</div> : categories.length === 0 ? <p className="py-8 text-sm theme-text-muted">No fee categories found.</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-black/10"><tr><th className="px-3 py-3 theme-text-muted">Category name</th><th className="px-3 py-3 text-right theme-text-muted">Actions</th></tr></thead>
                  <tbody>{categories.map((category) => { const id = categoryId(category); return <tr key={id} className="border-b border-black/5"><td className="px-3 py-3">{categoryName(category)}</td><td className="px-3 py-3 text-right"><button type="button" className="theme-text-primary underline" onClick={() => void startEditing(id)}>Edit</button></td></tr>; })}</tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-semibold theme-text">{editingId ? "Edit category" : "Add category"}</h2>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <Input label="Category name" placeholder="Tuition fee" value={name} onChange={(event) => setName(event.target.value)} disabled={submitting} />
              <div className="flex justify-end gap-3">
                {editingId ? <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button> : null}
                <Button type="submit" loading={submitting}>{submitting ? "Saving..." : editingId ? "Save changes" : "Create category"}</Button>
              </div>
            </form>
          </Card>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <Card>
            <h2 className="mb-4 text-lg font-semibold theme-text">Fee types</h2>
            {loading ? <div className="text-sm theme-text-muted">Loading fee types...</div> : feeTypes.length === 0 ? <p className="py-8 text-sm theme-text-muted">No fee types found.</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-black/10"><tr><th className="px-3 py-3 theme-text-muted">Name</th><th className="px-3 py-3 theme-text-muted">Category</th><th className="px-3 py-3 theme-text-muted">Amount</th><th className="px-3 py-3 theme-text-muted">Term</th><th className="px-3 py-3 theme-text-muted">Status</th><th className="px-3 py-3 text-right theme-text-muted">Actions</th></tr></thead>
                  <tbody>{feeTypes.map((feeType) => { const id = feeTypeId(feeType); const selectedCategory = categories.find((category) => categoryId(category) === feeTypeCategoryId(feeType)); const active = feeType.IsActive ?? feeType.isActive ?? true; return <tr key={id} className="border-b border-black/5"><td className="px-3 py-3">{feeTypeName(feeType)}</td><td className="px-3 py-3">{selectedCategory ? categoryName(selectedCategory) : "Unknown category"}</td><td className="px-3 py-3">{feeType.Currency ?? feeType.currency ?? "PKR"} {feeType.Amount ?? feeType.amount ?? 0}</td><td className="px-3 py-3">{feeType.Per ?? feeType.per ?? "-"}</td><td className="px-3 py-3">{active ? "Active" : "Inactive"}</td><td className="px-3 py-3 text-right"><button type="button" className="theme-text-primary underline" onClick={() => void startEditingFeeType(id)}>Edit</button></td></tr>; })}</tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-semibold theme-text">{editingFeeTypeId ? "Edit fee type" : "Add fee type"}</h2>
            <form className="space-y-4" onSubmit={handleFeeTypeSubmit} noValidate>
              <Select label="Fee category" value={feeTypeForm.FeeCategoryId} onChange={(event) => setFeeTypeForm((current) => ({ ...current, FeeCategoryId: event.target.value }))} disabled={submitting}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={categoryId(category)} value={categoryId(category)}>{categoryName(category)}</option>)}
              </Select>
              <Input label="Name" placeholder="Examination Fee" value={feeTypeForm.Name} onChange={(event) => setFeeTypeForm((current) => ({ ...current, Name: event.target.value }))} disabled={submitting} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Amount" type="number" min="0" step="0.01" placeholder="0.00" value={feeTypeForm.Amount} onChange={(event) => setFeeTypeForm((current) => ({ ...current, Amount: event.target.value }))} disabled={submitting} />
                <Select label="Per" value={feeTypeForm.Per} onChange={(event) => setFeeTypeForm((current) => ({ ...current, Per: event.target.value }))} disabled={submitting}><option value="month">Month</option><option value="year">Year</option><option value="one-time">One-time</option></Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <Card>
            <h2 className="mb-4 text-lg font-semibold theme-text">Charged fees</h2>
            {loading ? <div className="text-sm theme-text-muted">Loading charged fees...</div> : applicableFees.length === 0 ? <p className="py-8 text-sm theme-text-muted">No fees have been charged yet.</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-black/10"><tr><th className="px-3 py-3 theme-text-muted">Student</th><th className="px-3 py-3 theme-text-muted">Fee</th><th className="px-3 py-3 theme-text-muted">Amount</th><th className="px-3 py-3 theme-text-muted">Term</th><th className="px-3 py-3 theme-text-muted">Status</th><th className="px-3 py-3 text-right theme-text-muted">Actions</th></tr></thead>
                  <tbody>{applicableFees.map((fee) => {
                    const id = applicableFeeId(fee);
                    const student = students.find((item) => comparableId(studentId(item)) === comparableId(applicableFeeStudentId(fee)));
                    const feeType = feeTypes.find((item) => comparableId(feeTypeId(item)) === comparableId(applicableFeeTypeId(fee))) ?? applicableFeeType(fee);
                    const activeStatus = fee.Status ?? fee.status;
                    return <tr key={id} className="border-b border-black/5"><td className="px-3 py-3">{fee.StudentName ?? fee.studentName ?? (student ? studentName(student) : "Unknown student")}</td><td className="px-3 py-3">{applicableFeeName(fee, feeType)}</td><td className="px-3 py-3">{applicableFeeAmount(fee, feeType)}</td><td className="px-3 py-3">{applicableFeeTerm(fee, feeType) || "-"}</td><td className="px-3 py-3">{activeStatus ?? "Charged"}</td><td className="px-3 py-3 text-right"><button type="button" className="theme-text-primary underline" onClick={() => void startEditingApplicableFee(id)}>Edit</button></td></tr>;
                  })}</tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-semibold theme-text">{editingApplicableFeeId ? "Edit charged fee" : "Charge a student"}</h2>
            <form className="space-y-4" onSubmit={handleApplicableFeeSubmit} noValidate>
              <Select label="Student" value={applicableFeeForm.StudentId} onChange={(event) => setApplicableFeeForm((current) => ({ ...current, StudentId: event.target.value }))} disabled={submitting}>
                <option value="">Select student</option>
                {students.map((student) => <option key={studentId(student)} value={studentId(student)}>{studentName(student)}</option>)}
              </Select>
              <Select label="Fee type" value={applicableFeeForm.FeeTypeId} onChange={(event) => setApplicableFeeForm((current) => ({ ...current, FeeTypeId: event.target.value }))} disabled={submitting}>
                <option value="">Select fee type</option>
                {feeTypes.map((feeType) => <option key={feeTypeId(feeType)} value={feeTypeId(feeType)}>{feeTypeName(feeType)} - {feeType.Amount ?? feeType.amount ?? 0} {feeType.Currency ?? feeType.currency ?? "PKR"}</option>)}
              </Select>
              <p className="text-xs theme-text-muted">A student can receive multiple fee charges by selecting different fee types.</p>
              <div className="flex justify-end gap-3">
                {editingApplicableFeeId ? <Button type="button" variant="ghost" onClick={resetApplicableFeeForm}>Cancel</Button> : null}
                <Button type="submit" loading={submitting}>{submitting ? "Saving..." : editingApplicableFeeId ? "Save changes" : "Charge fee"}</Button>
              </div>
            </form>
          </Card>
        </div>
        <Card className="mt-6">
          <h2 className="mb-4 text-lg font-semibold theme-text">Generate invoice</h2>
          <form className="space-y-4" onSubmit={handleGenerateInvoice} noValidate>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Select label="Student" value={invoiceForm.StudentId} onChange={(event) => void handleInvoiceStudentChange(event.target.value)} disabled={generatingInvoice || pendingFeesLoading}>
                <option value="">Select student</option>
                {students.map((student) => <option key={studentId(student)} value={studentId(student)}>{studentName(student)}</option>)}
              </Select>
              <Input label="Month" placeholder="September" value={invoiceForm.Month} onChange={(event) => setInvoiceForm((current) => ({ ...current, Month: event.target.value }))} disabled={generatingInvoice} />
              <Input label="Year" placeholder="2026" value={invoiceForm.Year} onChange={(event) => setInvoiceForm((current) => ({ ...current, Year: event.target.value }))} disabled={generatingInvoice} />
              <Input label="Due date" type="datetime-local" value={invoiceForm.DueDate} onChange={(event) => setInvoiceForm((current) => ({ ...current, DueDate: event.target.value }))} disabled={generatingInvoice} />
            </div>
            <fieldset disabled={!invoiceForm.StudentId || generatingInvoice}>
              <legend className="mb-2 block text-sm theme-text-soft">Charged fees to include</legend>
              {!invoiceForm.StudentId ? <p className="text-sm theme-text-muted">Select a student to see pending fees.</p> : pendingFeesLoading ? <p className="text-sm theme-text-muted">Loading pending fees...</p> : pendingFees.length === 0 ? <p className="text-sm theme-text-muted">This student has no pending fees.</p> : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{pendingFees.map((fee) => { const id = applicableFeeId(fee); const typeId = applicableFeeTypeId(fee); const feeType = feeTypes.find((item) => comparableId(feeTypeId(item)) === comparableId(typeId)) ?? applicableFeeType(fee); return <label key={id} className="flex items-center gap-3 rounded-lg border border-black/10 theme-bg-input p-3 text-sm theme-text"><input type="checkbox" checked={invoiceForm.FeeTypeIds.includes(typeId)} onChange={(event) => setInvoiceForm((current) => ({ ...current, FeeTypeIds: event.target.checked ? [...current.FeeTypeIds, typeId] : current.FeeTypeIds.filter((item) => item !== typeId) }))} />{applicableFeeName(fee, feeType)} - {applicableFeeAmount(fee, feeType)} {feeType?.Currency ?? feeType?.currency ?? "PKR"}</label>; })}</div>}
            </fieldset>
            <div className="flex justify-end"><Button type="submit" loading={generatingInvoice}>{generatingInvoice ? "Generating..." : "Generate invoice"}</Button></div>
          </form>
        </Card>
        <Card className="mt-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold theme-text">Invoice history</h2>
              <p className="mt-1 text-sm theme-text-muted">Select a student to review all invoice lines issued to them.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:max-w-xs">
              <Select label="Student" value={invoiceHistoryStudentId} onChange={(event) => void handleInvoiceHistoryStudentChange(event.target.value)} disabled={invoiceHistoryLoading}>
                <option value="">Select student</option>
                {students.map((student) => <option key={studentId(student)} value={studentId(student)}>{studentName(student)}</option>)}
              </Select>
            </div>
          </div>
          {!invoiceHistoryStudentId ? <p className="py-8 text-sm theme-text-muted">Select a student to view invoice history.</p> : invoiceHistoryLoading ? <p className="py-8 text-sm theme-text-muted">Loading invoice history...</p> : invoiceHistory.length === 0 ? <p className="py-8 text-sm theme-text-muted">No invoices found for this student.</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-black/10"><tr><th className="px-3 py-3 theme-text-muted">Invoice</th><th className="px-3 py-3 theme-text-muted">Fee</th><th className="px-3 py-3 theme-text-muted">Amount</th><th className="px-3 py-3 theme-text-muted">Paid</th><th className="px-3 py-3 theme-text-muted">Due</th><th className="px-3 py-3 theme-text-muted">Period</th><th className="px-3 py-3 theme-text-muted">Due date</th><th className="px-3 py-3 theme-text-muted">Status</th></tr></thead>
                <tbody>{invoiceGroups.flatMap(([invoiceNumberValue, invoices]) => invoices.map((invoice, index) => { const paid = invoice.ispaid ?? invoice.IsPaid ?? false; return <tr key={invoice.id ?? invoice.Id ?? `${invoiceNumberValue}-${invoice.feeTypeId ?? invoice.FeeTypeId}`} className="border-b border-black/5">{index === 0 ? <td rowSpan={invoices.length} className="px-3 py-3 align-top font-medium"><div className="space-y-2">{invoiceNumberValue}<PDFDownloadLink document={<InvoicePdfDocument invoices={invoices} student={students.find((student) => comparableId(studentId(student)) === comparableId(invoiceHistoryStudentId)) ?? {}} />} fileName={`${invoiceNumberValue}.pdf`} className="block w-fit rounded-lg theme-bg-primary px-2.5 py-1.5 text-xs theme-text-on-primary">{({ loading: pdfLoading }) => pdfLoading ? "Preparing..." : "Download PDF"}</PDFDownloadLink></div></td> : null}<td className="px-3 py-3">{invoiceFeeName(invoice)}</td><td className="px-3 py-3">{invoice.currency ?? invoice.Currency ?? "PKR"} {invoiceAmount(invoice).toFixed(2)}</td><td className="px-3 py-3">{invoice.currency ?? invoice.Currency ?? "PKR"} {(invoice.amountPaid ?? invoice.AmountPaid ?? 0).toFixed(2)}</td><td className="px-3 py-3">{invoice.currency ?? invoice.Currency ?? "PKR"} {invoiceAmountDue(invoice).toFixed(2)}</td><td className="px-3 py-3">{invoice.month ?? invoice.Month ?? "-"} {invoice.year ?? invoice.Year ?? ""}</td><td className="px-3 py-3">{invoiceDate(invoice.dueDate ?? invoice.DueDate)}</td><td className="px-3 py-3">{paid ? "Paid" : "Unpaid"}</td></tr>; }))}</tbody>
              </table>
            </div>
          )}
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}