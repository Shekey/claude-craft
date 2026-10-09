import type { Currency } from "../../../shared/lib";

export type Category = "food" | "transport" | "housing" | "fun" | "other";

export type Expense = {
  id: string;
  title: string;
  amountCents: number;
  currency: Currency;
  category: Category;
  date: string;
  note: string;
  receiptId?: string;
};

export type ScannedReceipt = Pick<Expense, "title" | "amountCents" | "currency" | "category" | "date"> & { confidence: number };
