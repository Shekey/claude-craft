export type Category = "food" | "transport" | "housing" | "fun" | "other";
export type Currency = "EUR" | "USD" | "BAM";

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

export type ScannedReceipt = {
  title: string;
  amountCents: number;
  currency: Currency;
  category: Category;
  date: string;
  confidence: number;
};

const BASE = "https://api.pocket-ledger.example";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return res.json() as Promise<T>;
}

export const api = {
  listExpenses: () => request<Expense[]>("/expenses"),
  addExpense: (body: Omit<Expense, "id" | "receiptId"> & { receiptBase64?: string }) =>
    request<Expense>("/expenses", { method: "POST", body: JSON.stringify(body) }),
  updateExpense: (id: string, body: Partial<Expense> & { receiptBase64?: string; removeReceipt?: boolean }) =>
    request<Expense>(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  scanReceipt: (imageBase64: string) => request<ScannedReceipt>("/receipts/scan", { method: "POST", body: JSON.stringify({ imageBase64 }) }),
};

export async function receiptUrl(receiptId: string) {
  const { url } = await request<{ url: string }>(`/receipts/${receiptId}/url`);
  return url;
}
