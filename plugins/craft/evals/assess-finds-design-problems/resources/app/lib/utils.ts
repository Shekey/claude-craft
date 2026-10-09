import type { Category, Currency, Expense } from "./api";

export const CATEGORY_OPTIONS: { value: Category; label: string; monthlyLimitCents: number }[] = [
  { value: "food", label: "Food", monthlyLimitCents: 40000 },
  { value: "transport", label: "Transport", monthlyLimitCents: 12000 },
  { value: "housing", label: "Housing", monthlyLimitCents: 90000 },
  { value: "fun", label: "Fun", monthlyLimitCents: 15000 },
  { value: "other", label: "Other", monthlyLimitCents: 10000 },
];

export const categoryLabel = (c: Category) => CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c;

export function formatMoney(cents: number, currency: Currency) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

export function isLikelyDuplicate(existing: Expense[], candidate: Omit<Expense, "id" | "receiptId">) {
  return existing.find(
    (e) =>
      e.amountCents === candidate.amountCents &&
      e.date === candidate.date &&
      e.category === candidate.category &&
      e.title.trim().toLowerCase() === candidate.title.trim().toLowerCase(),
  );
}

export function isOverMonthlyLimit(expenses: Expense[], category: Category, month: string) {
  const limit = CATEGORY_OPTIONS.find((o) => o.value === category)?.monthlyLimitCents ?? Infinity;
  const spent = expenses.filter((e) => e.category === category && e.date.startsWith(month)).reduce((sum, e) => sum + e.amountCents, 0);
  return spent > limit;
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
