"use client";

import { useEffect, useState } from "react";
import { ChartCard, EmptyChart, Legend, StackedBar, StatTile, chartColors, type Segment } from "@/src/components/charts/Charts";
import { MONTHS, Pager, money } from "@/src/components/fees/InvoicesTab";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import {
  getDefaulters,
  getFeeSummary,
  getLedger,
  type Defaulter,
  type FeeReportRow,
  type FeeStudent,
  type FeeSummary,
  type Ledger,
} from "@/src/lib/api/fee-reports.api";
import { paymentModeLabel, type Paged } from "@/src/lib/api/invoices.api";
import { formatSectionText } from "@/src/lib/utils";

function RowsTable({ head, rows, currency }: { head: string; rows: FeeReportRow[]; currency: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead className="border-b border-black/10 text-left theme-text-muted">
          <tr>
            <th className="px-2 py-1 font-medium">{head}</th>
            {["Invoices", "Billed", "Collected", "Outstanding"].map((item) => <th key={item} className="px-2 py-1 text-right font-medium">{item}</th>)}
          </tr>
        </thead>
        <tbody className="tabular-nums theme-text-soft">
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-black/5">
              <td className="px-2 py-1 theme-text">{row.label}</td>
              <td className="px-2 py-1 text-right">{row.invoices}</td>
              <td className="whitespace-nowrap px-2 py-1 text-right">{money(row.billed, currency)}</td>
              <td className="whitespace-nowrap px-2 py-1 text-right">{money(row.collected, currency)}</td>
              <td className="whitespace-nowrap px-2 py-1 text-right">{money(row.outstanding, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsTab({ sections, students }: { sections: { id: string; name: string }[]; students: FeeStudent[] }) {
  const { notify } = useNotifications();
  const [filters, setFilters] = useState({ month: "", year: "", sectionId: "", currency: "" });
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [defaulters, setDefaulters] = useState<Paged<Defaulter> | null>(null);
  const [defaulterPage, setDefaulterPage] = useState(1);
  const [ledgerStudentId, setLedgerStudentId] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      getFeeSummary(filters)
        .then(setSummary)
        .catch((error) => notify("error", "Report unavailable", error instanceof ApiError ? error.message : "Unable to load the report."));
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, notify]);

  useEffect(() => {
    getDefaulters(filters.sectionId, filters.currency, defaulterPage)
      .then(setDefaulters)
      .catch((error) => notify("error", "Defaulters unavailable", error instanceof ApiError ? error.message : "Unable to load defaulters."));
  }, [filters.sectionId, filters.currency, defaulterPage, notify]);

  const openLedger = async (studentId: string, currency = "") => {
    setLedgerStudentId(studentId);
    setLedger(null);
    if (!studentId) return;
    try {
      setLedger(await getLedger(studentId, currency));
    } catch (error) {
      notify("error", "Ledger unavailable", error instanceof ApiError ? error.message : "Unable to load this ledger.");
    }
  };

  const setFilter = (key: keyof typeof filters) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((current) => ({ ...current, [key]: event.target.value }));

  const currency = summary?.currency ?? "PKR";
  const segments: Segment[] = summary
    ? [
        { label: "Collected", value: summary.collected, color: chartColors.present },
        { label: "Not yet due", value: Math.max(summary.outstanding - summary.overdue, 0), color: chartColors.late },
        { label: "Overdue", value: summary.overdue, color: chartColors.absent },
      ]
    : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Select label="Month" value={filters.month} onChange={setFilter("month")}>
          <option value="">All</option>
          {MONTHS.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Input label="Year" placeholder="All" value={filters.year} onChange={setFilter("year")} />
        <Select label="Section" value={filters.sectionId} onChange={setFilter("sectionId")}>
          <option value="">All</option>
          {sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
        {(summary?.currencies.length ?? 0) > 1 ? (
          <Select label="Currency" value={filters.currency || summary?.currency} onChange={setFilter("currency")}>
            {summary?.currencies.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        ) : null}
      </div>

      {!summary ? <p className="text-sm theme-text-muted">Loading report...</p> : (
        <>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
            <StatTile label="Billed" value={money(summary.netBilled, currency)} hint={`${summary.invoices} invoices`} />
            <StatTile label="Collected" value={money(summary.collected, currency)} />
            <StatTile label="Outstanding" value={money(summary.outstanding, currency)} />
            <StatTile label="Overdue" value={money(summary.overdue, currency)} />
            <StatTile label="Discounts" value={money(summary.discounts, currency)} hint="Including scholarships" />
            <StatTile label="Late fees" value={money(summary.lateFees, currency)} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <ChartCard title="Collection" subtitle="Share of the amount billed">
              {summary.netBilled > 0 ? (
                <div className="space-y-2.5">
                  <StackedBar segments={segments} format={(value) => money(value, currency)} />
                  <Legend segments={segments} format={(value) => money(value, currency)} />
                  <p className="text-xs theme-text-muted">
                    {Object.entries(summary.byStatus).map(([status, count]) => `${count} ${status.toLowerCase()}`).join(", ")}
                  </p>
                </div>
              ) : <EmptyChart message="No invoices match these filters." />}
            </ChartCard>
            <ChartCard title="By payment mode" subtitle="Net of reversals">
              {summary.byMode.length > 0 ? (
                <ul className="divide-y divide-black/5 text-xs">
                  {summary.byMode.map((row) => (
                    <li key={row.mode} className="flex justify-between py-1">
                      <span className="theme-text-soft">{paymentModeLabel(row.mode)}</span>
                      <span className="font-medium tabular-nums theme-text">{money(row.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              ) : <EmptyChart message="No payments match these filters." />}
            </ChartCard>
            <ChartCard title="By month" subtitle="Grouped by due date">
              {summary.byMonth.length > 0 ? <RowsTable head="Month" rows={summary.byMonth} currency={currency} /> : <EmptyChart message="No invoices match these filters." />}
            </ChartCard>
            <ChartCard title="By fee type">
              {summary.byFeeType.length > 0 ? <RowsTable head="Fee" rows={summary.byFeeType} currency={currency} /> : <EmptyChart message="No invoices match these filters." />}
            </ChartCard>
          </div>
        </>
      )}

      <ChartCard title="Defaulters" subtitle="Students with overdue balances, largest first">
        {!defaulters ? <p className="text-xs theme-text-muted">Loading...</p> : defaulters.items.length === 0 ? <EmptyChart message="No overdue balances." /> : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-black/10 theme-text-muted">
                  <tr>{["Student", "Code", "Section", "Invoices", "Overdue", "Oldest due date", ""].map((head) => <th key={head} className="whitespace-nowrap px-2 py-1 font-medium">{head}</th>)}</tr>
                </thead>
                <tbody className="theme-text-soft">
                  {defaulters.items.map((row) => (
                    <tr key={row.studentId} className="border-b border-black/5">
                      <td className="whitespace-nowrap px-2 py-1 theme-text">{row.studentName}</td>
                      <td className="px-2 py-1">{row.studentCode}</td>
                      <td className="whitespace-nowrap px-2 py-1">{formatSectionText(row.section)}</td>
                      <td className="px-2 py-1 tabular-nums">{row.invoices}</td>
                      <td className="whitespace-nowrap px-2 py-1 font-medium tabular-nums theme-text">{money(row.overdue, currency)}</td>
                      <td className="whitespace-nowrap px-2 py-1">{new Date(row.oldestDueDate).toLocaleDateString()}</td>
                      <td className="px-2 py-1 text-right"><button type="button" className="theme-text-primary underline" onClick={() => void openLedger(row.studentId)}>Ledger</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={defaulters.page} pageSize={defaulters.pageSize} total={defaulters.total} onChange={setDefaulterPage} />
          </>
        )}
      </ChartCard>

      <ChartCard title="Student ledger" subtitle="Every charge and payment with a running balance">
        <div className="mb-2 flex max-w-md gap-2">
          <Select aria-label="Student" value={ledgerStudentId} onChange={(event) => void openLedger(event.target.value)}>
            <option value="">Select student</option>
            {students.map((student) => <option key={student.studentId} value={student.studentId}>{student.fullName} ({student.studentCode})</option>)}
          </Select>
          {(ledger?.currencies.length ?? 0) > 1 ? (
            <Select aria-label="Ledger currency" className="w-24" value={ledger?.currency} onChange={(event) => void openLedger(ledgerStudentId, event.target.value)}>
              {ledger?.currencies.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          ) : null}
        </div>
        {!ledgerStudentId ? null : !ledger ? <p className="text-xs theme-text-muted">Loading...</p> : ledger.entries.length === 0 ? <EmptyChart message="This student has no fee records." /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-black/10 theme-text-muted">
                <tr>
                  {["Date", "Type", "Details", "Invoice"].map((head) => <th key={head} className="px-2 py-1 font-medium">{head}</th>)}
                  {["Charge", "Credit", "Balance"].map((head) => <th key={head} className="px-2 py-1 text-right font-medium">{head}</th>)}
                </tr>
              </thead>
              <tbody className="theme-text-soft">
                {ledger.entries.map((entry, index) => (
                  <tr key={index} className="border-b border-black/5">
                    <td className="whitespace-nowrap px-2 py-1">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-2 py-1 theme-text">{entry.type === "LateFee" ? "Late fee" : entry.type}</td>
                    <td className="px-2 py-1">{entry.description}</td>
                    <td className="whitespace-nowrap px-2 py-1">{entry.invoiceNum}</td>
                    <td className="whitespace-nowrap px-2 py-1 text-right tabular-nums">{entry.debit ? money(entry.debit, ledger.currency) : ""}</td>
                    <td className="whitespace-nowrap px-2 py-1 text-right tabular-nums">{entry.credit ? money(entry.credit, ledger.currency) : ""}</td>
                    <td className="whitespace-nowrap px-2 py-1 text-right font-medium tabular-nums theme-text">{money(entry.balance, ledger.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
