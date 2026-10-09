import { type Currency, formatAmount, isIsoDate, parseAmount } from "../../../shared/lib";
import type { Category, Expense, ScannedReceipt } from "./types";

export type ExpenseDraft = {
  title: string;
  amount: string;
  currency: Currency;
  category: Category;
  date: string;
  note: string;
};

export type ExpenseFields = Omit<Expense, "id" | "receiptId">;

export type DraftCheck = { ok: true; fields: ExpenseFields } | { ok: false; problem: "title" | "amount" | "date" };

export const emptyDraft = (today: string): ExpenseDraft => ({ title: "", amount: "", currency: "EUR", category: "food", date: today, note: "" });

export const draftFromExpense = (e: Expense): ExpenseDraft => ({
  title: e.title,
  amount: formatAmount(e.amountCents),
  currency: e.currency,
  category: e.category,
  date: e.date,
  note: e.note,
});

export const draftFromScan = (draft: ExpenseDraft, scan: ScannedReceipt): ExpenseDraft => ({
  ...draft,
  title: scan.title,
  amount: formatAmount(scan.amountCents),
  currency: scan.currency,
  category: scan.category,
  date: scan.date,
});

export function checkDraft(d: ExpenseDraft): DraftCheck {
  const title = d.title.trim();
  if (!title) return { ok: false, problem: "title" };
  const amountCents = parseAmount(d.amount);
  if (amountCents === null) return { ok: false, problem: "amount" };
  if (!isIsoDate(d.date)) return { ok: false, problem: "date" };
  return { ok: true, fields: { title, amountCents, currency: d.currency, category: d.category, date: d.date, note: d.note.trim() } };
}

export function findDuplicate(existing: Expense[], fields: ExpenseFields) {
  return existing.find(
    (e) =>
      e.amountCents === fields.amountCents &&
      e.currency === fields.currency &&
      e.date === fields.date &&
      e.category === fields.category &&
      e.title.trim().toLowerCase() === fields.title.toLowerCase(),
  );
}
