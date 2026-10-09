import type { Currency } from "../../../shared/lib";
import type { Category, Expense } from "./types";

export const BUDGET_CURRENCY: Currency = "EUR";

export const CATEGORIES: Record<Category, { label: string; monthlyLimitCents: number }> = {
  food: { label: "Food", monthlyLimitCents: 40000 },
  transport: { label: "Transport", monthlyLimitCents: 12000 },
  housing: { label: "Housing", monthlyLimitCents: 90000 },
  fun: { label: "Fun", monthlyLimitCents: 15000 },
  other: { label: "Other", monthlyLimitCents: 10000 },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export function isOverMonthlyLimit(expenses: Expense[], category: Category, month: string) {
  const spent = expenses
    .filter((e) => e.category === category && e.currency === BUDGET_CURRENCY && e.date.startsWith(month))
    .reduce((sum, e) => sum + e.amountCents, 0);
  return spent > CATEGORIES[category].monthlyLimitCents;
}
