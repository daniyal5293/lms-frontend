import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { paymentModeLabel, type InvoiceRow, type Receipt } from "@/src/lib/api/invoices.api";
import { formatSectionText } from "@/src/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", color: "#10271a", fontSize: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: "2 solid #0a7f3f", paddingBottom: 14, marginBottom: 20 },
  brand: { fontSize: 20, fontWeight: 700, color: "#0a7f3f" },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#687f71" },
  columns: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", borderBottom: "1 solid #d6e6db", paddingVertical: 6 },
  total: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, fontWeight: 700 },
  footer: { marginTop: 24, borderTop: "1 solid #d6e6db", paddingTop: 10, color: "#687f71" },
});

const money = (value: number, currency: string) => `${currency} ${value.toFixed(2)}`;

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

function InvoiceDocument({ invoice }: { invoice: InvoiceRow }) {
  const { currency } = invoice;
  return (
    <Document title={`Invoice ${invoice.invoiceNum}`} author="TCF Campus">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>TCF Campus</Text>
            <Text style={styles.muted}>Student invoice</Text>
          </View>
          <View>
            <Text style={styles.title}>Invoice</Text>
            <Text style={styles.muted}>{invoice.invoiceNum}</Text>
          </View>
        </View>
        <View style={styles.columns}>
          <View>
            <Text style={styles.title}>{invoice.studentName}</Text>
            <Text style={styles.muted}>Student code: {invoice.studentCode}</Text>
            <Text style={styles.muted}>Section: {formatSectionText(invoice.section)}</Text>
          </View>
          <View>
            <Text>For: {invoice.month} {invoice.year}</Text>
            <Text>Due date: {new Date(invoice.dueDate).toLocaleDateString()}</Text>
            <Text>Status: {invoice.status}</Text>
          </View>
        </View>
        <Line label={invoice.feeTypeName} value={money(invoice.amount, currency)} />
        {invoice.lateFee > 0 ? <Line label="Late fee" value={money(invoice.lateFee, currency)} /> : null}
        {invoice.discount > 0 ? <Line label="Discounts and scholarships" value={`- ${money(invoice.discount, currency)}`} /> : null}
        <Line label="Total" value={money(invoice.netAmount, currency)} />
        <Line label="Paid" value={money(invoice.amountPaid, currency)} />
        <View style={styles.total}>
          <Text>Balance due</Text>
          <Text>{money(invoice.amountDue, currency)}</Text>
        </View>
        <View style={styles.footer}>
          <Text>Generated on {new Date().toLocaleDateString()}.</Text>
        </View>
      </Page>
    </Document>
  );
}

function ReceiptDocument({ receipt }: { receipt: Receipt }) {
  const { transaction } = receipt;
  const { currency } = transaction;
  return (
    <Document title={`Receipt ${receipt.receiptNo}`} author="TCF Campus">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>TCF Campus</Text>
            <Text style={styles.muted}>Payment receipt</Text>
          </View>
          <View>
            <Text style={styles.title}>Receipt</Text>
            <Text style={styles.muted}>{receipt.receiptNo}</Text>
          </View>
        </View>
        <View style={styles.columns}>
          <View>
            <Text style={styles.title}>{transaction.studentName}</Text>
            <Text style={styles.muted}>Student code: {receipt.studentCode}</Text>
            <Text style={styles.muted}>Section: {formatSectionText(receipt.section)}</Text>
          </View>
          <View>
            <Text>Date: {new Date(transaction.paidAt).toLocaleDateString()}</Text>
            <Text>Invoice: {transaction.invoiceNum}</Text>
            <Text>For: {receipt.period}</Text>
          </View>
        </View>
        <Line label={transaction.feeTypeName} value={money(transaction.amount, currency)} />
        <Line label="Payment mode" value={paymentModeLabel(transaction.mode)} />
        <Line label="Reference" value={transaction.transactionReference} />
        <Line label="Invoice total" value={money(receipt.invoiceNet, currency)} />
        <Line label="Total paid to date" value={money(receipt.invoicePaid, currency)} />
        <View style={styles.total}>
          <Text>Balance due</Text>
          <Text>{money(receipt.balanceDue, currency)}</Text>
        </View>
        <View style={styles.footer}>
          {transaction.isReversed ? <Text>This payment has been reversed and is no longer valid.</Text> : null}
          <Text>Recorded by {transaction.recordedBy ?? "the fee office"}. Generated on {new Date().toLocaleDateString()}.</Text>
        </View>
      </Page>
    </Document>
  );
}

async function download(element: ReactElement, fileName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(element as any).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export const downloadInvoicePdf = (invoice: InvoiceRow) => download(<InvoiceDocument invoice={invoice} />, `${invoice.invoiceNum}.pdf`);

export const downloadReceiptPdf = (receipt: Receipt) => download(<ReceiptDocument receipt={receipt} />, `${receipt.receiptNo}.pdf`);
