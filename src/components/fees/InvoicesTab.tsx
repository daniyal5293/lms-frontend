"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import {
  ADJUSTMENT_TYPES,
  PAYMENT_MODES,
  addAdjustment,
  adjustmentLabel,
  listAdjustments,
  listInvoices,
  payInvoice,
  paymentModeLabel,
  removeAdjustment,
  voidInvoice,
  type Adjustment,
  type InvoiceRow,
  type InvoiceStatus,
  type Paged,
} from "@/src/lib/api/invoices.api";
import { formatSectionText } from "@/src/lib/utils";
import { downloadInvoicePdf } from "@/src/components/fees/feePdf";

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const money = (value: number, currency = "PKR") => `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const STATUS_TONE: Record<InvoiceStatus, "success" | "warning" | "danger" | "info" | "default"> = {
  Paid: "success",
  Partial: "info",
  Unpaid: "warning",
  Overdue: "danger",
  Voided: "default",
};

export const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <Badge tone={STATUS_TONE[status]}>{status === "Voided" ? "Cancelled" : status}</Badge>
);

export function Pager({ page, pageSize, total, onChange }: { page: number; pageSize: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.max(Math.ceil(total / pageSize), 1);
  if (total <= pageSize) return <p className="mt-2 text-xs theme-text-muted">{total} total</p>;
  return (
    <div className="mt-2 flex items-center justify-between gap-2 text-xs theme-text-muted">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
        <span>Page {page} of {pages}</span>
        <Button type="button" variant="ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

const errorText = (error: unknown, fallback: string) => (error instanceof ApiError ? error.message : fallback);

// Stays the same while the dialog is open, so a double-click cannot record the payment twice
const newReference = () => `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

function PayDialog({ invoice, onClose, onDone }: { invoice: InvoiceRow; onClose: () => void; onDone: () => void }) {
  const { notify } = useNotifications();
  const [amount, setAmount] = useState(String(invoice.amountDue));
  const [mode, setMode] = useState("0");
  const [reference, setReference] = useState(newReference);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await payInvoice(invoice.id, { invoiceID: invoice.id, amount: Number(amount), mode: Number(mode), transactionRef: reference.trim() });
      notify("success", "Payment recorded", `${money(Number(amount), invoice.currency)} recorded on ${invoice.invoiceNum}.`);
      onDone();
    } catch (error) {
      notify("error", "Payment failed", errorText(error, "Unable to record this payment."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title="Record payment" description={`${invoice.invoiceNum}, ${invoice.studentName}. Balance due ${money(invoice.amountDue, invoice.currency)}.`} onClose={onClose}>
      <form className="space-y-2.5" onSubmit={submit}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Input label="Amount" type="number" min="0.01" step="0.01" max={invoice.amountDue} value={amount} onChange={(event) => setAmount(event.target.value)} required disabled={saving} />
          <Select label="Payment mode" value={mode} onChange={(event) => setMode(event.target.value)} disabled={saving}>
            {PAYMENT_MODES.map((item, index) => <option key={item} value={index}>{paymentModeLabel(item)}</option>)}
          </Select>
        </div>
        <Input label="Reference" value={reference} onChange={(event) => setReference(event.target.value)} maxLength={100} required disabled={saving} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>Record payment</Button>
        </div>
      </form>
    </Modal>
  );
}

function AdjustDialog({ invoice, onClose, onDone }: { invoice: InvoiceRow; onClose: () => void; onDone: () => void }) {
  const { notify } = useNotifications();
  const [items, setItems] = useState<Adjustment[]>([]);
  const [type, setType] = useState("0");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await listAdjustments(invoice.id));
    } catch (error) {
      notify("error", "Adjustments unavailable", errorText(error, "Unable to load the adjustments."));
    }
  }, [invoice.id, notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await addAdjustment(invoice.id, { type: Number(type), amount: Number(amount), reason: reason.trim() });
      notify("success", "Adjustment added", `${adjustmentLabel(ADJUSTMENT_TYPES[Number(type)])} added to ${invoice.invoiceNum}.`);
      onDone();
    } catch (error) {
      notify("error", "Adjustment failed", errorText(error, "Unable to add this adjustment."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Adjustment) => {
    const removeReason = window.prompt(`Why are you removing this ${adjustmentLabel(item.type).toLowerCase()}?`);
    if (!removeReason?.trim()) return;
    try {
      await removeAdjustment(invoice.id, item.id, removeReason.trim());
      notify("success", "Adjustment removed", "The balance was updated.");
      onDone();
    } catch (error) {
      notify("error", "Removal failed", errorText(error, "Unable to remove this adjustment."));
    }
  };

  return (
    <Modal open title="Discount, scholarship or late fee" description={`${invoice.invoiceNum}. Balance due ${money(invoice.amountDue, invoice.currency)}.`} onClose={onClose}>
      {items.length > 0 ? (
        <ul className="mb-3 divide-y divide-black/5 text-xs">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2 py-1.5">
              <div className={item.isRemoved ? "line-through theme-text-muted" : "theme-text"}>
                <span className="font-medium">{adjustmentLabel(item.type)} {money(item.amount, invoice.currency)}</span>
                <span className="block theme-text-muted">{item.reason}{item.recordedBy ? `, by ${item.recordedBy}` : ""}</span>
              </div>
              {item.isRemoved ? <span className="theme-text-muted">Removed</span> : <button type="button" className="text-red-700 underline" onClick={() => void remove(item)}>Remove</button>}
            </li>
          ))}
        </ul>
      ) : null}
      <form className="space-y-2.5" onSubmit={submit}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Select label="Type" value={type} onChange={(event) => setType(event.target.value)} disabled={saving}>
            {ADJUSTMENT_TYPES.map((item, index) => <option key={item} value={index}>{adjustmentLabel(item)}</option>)}
          </Select>
          <Input label="Amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required disabled={saving} />
        </div>
        <Input label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} required disabled={saving} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Close</Button>
          <Button type="submit" loading={saving}>Add</Button>
        </div>
      </form>
    </Modal>
  );
}

function VoidDialog({ invoice, onClose, onDone }: { invoice: InvoiceRow; onClose: () => void; onDone: () => void }) {
  const { notify } = useNotifications();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await voidInvoice(invoice.id, reason.trim());
      notify("success", "Invoice cancelled", `${invoice.invoiceNum} was cancelled. The period can be billed again.`);
      onDone();
    } catch (error) {
      notify("error", "Cancel failed", errorText(error, "Unable to cancel this invoice."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title="Cancel invoice" description={`${invoice.invoiceNum}, ${invoice.studentName}. It stays in the records, marked as cancelled.`} onClose={onClose}>
      <form className="space-y-2.5" onSubmit={submit}>
        <Input label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} required disabled={saving} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Keep invoice</Button>
          <Button type="submit" variant="danger" loading={saving}>Cancel invoice</Button>
        </div>
      </form>
    </Modal>
  );
}

type Dialog = { kind: "pay" | "adjust" | "void"; invoice: InvoiceRow } | null;

export function InvoicesTab({ sections }: { sections: { id: string; name: string }[] }) {
  const { notify } = useNotifications();
  const [filters, setFilters] = useState({ search: "", status: "", month: "", year: "", sectionId: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<InvoiceRow> | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const load = useCallback(async () => {
    try {
      setData(await listInvoices({ ...filters, page }));
    } catch (error) {
      notify("error", "Invoices unavailable", errorText(error, "Unable to load invoices."));
    }
  }, [filters, page, notify]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const setFilter = (key: keyof typeof filters) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((current) => ({ ...current, [key]: event.target.value }));
    setPage(1);
  };

  const finish = () => {
    setDialog(null);
    void load();
  };

  const pdf = async (invoice: InvoiceRow) => {
    try {
      await downloadInvoicePdf(invoice);
    } catch {
      notify("error", "PDF failed", "Unable to prepare this invoice.");
    }
  };

  return (
    <Card>
      <div className="mb-2.5 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <Input label="Search" placeholder="Student, code or invoice" value={filters.search} onChange={setFilter("search")} />
        </div>
        <Select label="Status" value={filters.status} onChange={setFilter("status")}>
          <option value="">All</option>
          {["Unpaid", "Partial", "Paid", "Overdue"].map((item) => <option key={item} value={item.toLowerCase()}>{item}</option>)}
          <option value="voided">Cancelled</option>
        </Select>
        <Select label="Month" value={filters.month} onChange={setFilter("month")}>
          <option value="">All</option>
          {MONTHS.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Input label="Year" placeholder="All" value={filters.year} onChange={setFilter("year")} />
        <Select label="Section" value={filters.sectionId} onChange={setFilter("sectionId")}>
          <option value="">All</option>
          {sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </div>

      {!data ? <p className="py-6 text-sm theme-text-muted">Loading invoices...</p> : data.items.length === 0 ? <p className="py-6 text-sm theme-text-muted">No invoices match these filters.</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-black/10 theme-text-muted">
              <tr>
                {["Invoice", "Student", "Fee", "Period", "Total", "Paid", "Due", "Due date", "Status", ""].map((head) => <th key={head} className="whitespace-nowrap px-2 py-1.5 font-medium">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.items.map((invoice) => (
                <tr key={invoice.id} className="border-b border-black/5">
                  <td className="whitespace-nowrap px-2 py-1 font-medium theme-text">{invoice.invoiceNum}</td>
                  <td className="px-2 py-1">
                    <span className="block whitespace-nowrap theme-text">{invoice.studentName}</span>
                    <span className="block whitespace-nowrap text-[11px] theme-text-muted">{invoice.studentCode}, {formatSectionText(invoice.section)}</span>
                  </td>
                  <td className="px-2 py-1 theme-text-soft">{invoice.feeTypeName}</td>
                  <td className="whitespace-nowrap px-2 py-1 theme-text-soft">{invoice.month} {invoice.year}</td>
                  <td className="whitespace-nowrap px-2 py-1 tabular-nums theme-text-soft" title={invoice.discount || invoice.lateFee ? `Fee ${invoice.amount}, late fee ${invoice.lateFee}, discounts ${invoice.discount}` : undefined}>{money(invoice.netAmount, invoice.currency)}</td>
                  <td className="whitespace-nowrap px-2 py-1 tabular-nums theme-text-soft">{money(invoice.amountPaid, invoice.currency)}</td>
                  <td className="whitespace-nowrap px-2 py-1 font-medium tabular-nums theme-text">{money(Math.max(invoice.amountDue, 0), invoice.currency)}</td>
                  <td className="whitespace-nowrap px-2 py-1 theme-text-soft">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="px-2 py-1" title={invoice.voidReason ?? undefined}><InvoiceStatusBadge status={invoice.status} /></td>
                  <td className="whitespace-nowrap px-2 py-1 text-right">
                    <div className="flex justify-end gap-2">
                      {!invoice.isVoided && invoice.amountDue > 0 ? <button type="button" className="font-medium theme-text-primary underline" onClick={() => setDialog({ kind: "pay", invoice })}>Pay</button> : null}
                      {!invoice.isVoided ? <button type="button" className="theme-text-primary underline" onClick={() => setDialog({ kind: "adjust", invoice })}>Adjust</button> : null}
                      <button type="button" className="theme-text-primary underline" onClick={() => void pdf(invoice)}>PDF</button>
                      {!invoice.isVoided && invoice.amountPaid === 0 ? <button type="button" className="text-red-700 underline" onClick={() => setDialog({ kind: "void", invoice })}>Cancel</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data ? <Pager page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} /> : null}

      {dialog?.kind === "pay" ? <PayDialog invoice={dialog.invoice} onClose={() => setDialog(null)} onDone={finish} /> : null}
      {dialog?.kind === "adjust" ? <AdjustDialog invoice={dialog.invoice} onClose={() => setDialog(null)} onDone={finish} /> : null}
      {dialog?.kind === "void" ? <VoidDialog invoice={dialog.invoice} onClose={() => setDialog(null)} onDone={finish} /> : null}
    </Card>
  );
}
