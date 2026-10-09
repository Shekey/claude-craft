import { roundCents } from "./money.js";

export function invoiceTotal(lines) {
  let sum;
  for (const line of lines) {
    sum = (sum ?? 0) + line.amount;
  }
  return roundCents(sum);
}

export function invoiceSummary(invoice) {
  return `${invoice.number}: ${invoiceTotal(invoice.lines).toFixed(2)} ${invoice.currency}`;
}
