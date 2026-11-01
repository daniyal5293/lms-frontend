"use client";

import { useCallback, useEffect, useState } from "react";
import { Pager, money } from "@/src/components/fees/InvoicesTab";
import { downloadReceiptPdf } from "@/src/components/fees/feePdf";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import {
  PAYMENT_MODES,
  getReceipt,
  listTransactions,
  paymentModeLabel,
  reverseTransaction,
  type Paged,
  type TransactionRow,
} from "@/src/lib/api/invoices.api";

export function TransactionsTab() {
  const { notify } = useNotifications();
  const [filters, setFilters] = useState({ search: "", from: "", to: "", mode: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<TransactionRow> | null>(null);
  const [reversing, setReversing] = useState<TransactionRow | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await listTransactions({ ...filters, page }));
    } catch (error) {
      notify("error", "Transactions unavailable", error instanceof ApiError ? error.message : "Unable to load transactions.");
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

  const submitReversal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reversing) return;
    setSaving(true);
    try {
      await reverseTransaction(reversing.transactionId, reason.trim());
      notify("success", "Payment reversed", "The balance is due again. The original payment stays in the history.");
      setReversing(null);
      setReason("");
      void load();
    } catch (error) {
      notify("error", "Reversal failed", error instanceof ApiError ? error.message : "Unable to reverse this payment.");
    } finally {
      setSaving(false);
    }
  };

  const receipt = async (transaction: TransactionRow) => {
    try {
      await downloadReceiptPdf(await getReceipt(transaction.transactionId));
    } catch (error) {
      notify("error", "Receipt failed", error instanceof ApiError ? error.message : "Unable to prepare this receipt.");
    }
  };

  return (
    <Card>
      <div className="mb-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1">
          <Input label="Search" placeholder="Student, invoice or reference" value={filters.search} onChange={setFilter("search")} />
        </div>
        <Input label="From" type="date" value={filters.from} onChange={setFilter("from")} />
        <Input label="To" type="date" value={filters.to} onChange={setFilter("to")} />
        <Select label="Mode" value={filters.mode} onChange={setFilter("mode")}>
          <option value="">All</option>
          {PAYMENT_MODES.map((item, index) => <option key={item} value={index}>{paymentModeLabel(item)}</option>)}
        </Select>
      </div>

      {!data ? <p className="py-6 text-sm theme-text-muted">Loading transactions...</p> : data.items.length === 0 ? <p className="py-6 text-sm theme-text-muted">No transactions match these filters.</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-black/10 theme-text-muted">
              <tr>
                {["Date", "Student", "Invoice", "Fee", "Amount", "Mode", "Reference", "Recorded by", ""].map((head) => <th key={head} className="whitespace-nowrap px-2 py-1.5 font-medium">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.items.map((transaction) => (
                <tr key={transaction.transactionId} className="border-b border-black/5">
                  <td className="whitespace-nowrap px-2 py-1 theme-text-soft">{new Date(transaction.paidAt).toLocaleDateString()}</td>
                  <td className="whitespace-nowrap px-2 py-1 theme-text">{transaction.studentName}</td>
                  <td className="whitespace-nowrap px-2 py-1 theme-text-soft">{transaction.invoiceNum}</td>
                  <td className="px-2 py-1 theme-text-soft">{transaction.feeTypeName}</td>
                  <td className="whitespace-nowrap px-2 py-1 font-medium tabular-nums theme-text">{money(transaction.amount, transaction.currency)}</td>
                  <td className="whitespace-nowrap px-2 py-1 theme-text-soft">{paymentModeLabel(transaction.mode)}</td>
                  <td className="px-2 py-1 theme-text-soft" title={transaction.reason ?? undefined}>{transaction.transactionReference}</td>
                  <td className="whitespace-nowrap px-2 py-1 theme-text-soft">{transaction.recordedBy ?? "–"}</td>
                  <td className="whitespace-nowrap px-2 py-1 text-right">
                    {transaction.kind === "Reversal" ? <Badge tone="warning">Reversal</Badge> : (
                      <div className="flex justify-end gap-2">
                        {transaction.isReversed ? <Badge>Reversed</Badge> : <button type="button" className="text-red-700 underline" onClick={() => setReversing(transaction)}>Reverse</button>}
                        <button type="button" className="theme-text-primary underline" onClick={() => void receipt(transaction)}>Receipt</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data ? <Pager page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} /> : null}

      {reversing ? (
        <Modal open title="Reverse payment" description={`${money(reversing.amount, reversing.currency)} on ${reversing.invoiceNum}. The balance becomes due again and this payment stays in the history.`} onClose={() => setReversing(null)}>
          <form className="space-y-2.5" onSubmit={submitReversal}>
            <Input label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} required disabled={saving} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setReversing(null)} disabled={saving}>Keep payment</Button>
              <Button type="submit" variant="danger" loading={saving}>Reverse payment</Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </Card>
  );
}
