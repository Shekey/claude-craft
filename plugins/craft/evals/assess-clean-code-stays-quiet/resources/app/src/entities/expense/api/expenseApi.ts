import { request } from "../../../shared/api";
import type { ExpenseFields } from "../model/draft";
import type { ReceiptChange } from "../model/receipt";
import type { Expense, ScannedReceipt } from "../model/types";

const body = (fields: ExpenseFields, receipt: ReceiptChange) => JSON.stringify({ ...fields, ...receipt });

export const expenseApi = {
  list: () => request<Expense[]>("/expenses"),
  create: (fields: ExpenseFields, receipt: ReceiptChange) => request<Expense>("/expenses", { method: "POST", body: body(fields, receipt) }),
  update: (id: string, fields: ExpenseFields, receipt: ReceiptChange) =>
    request<Expense>(`/expenses/${id}`, { method: "PATCH", body: body(fields, receipt) }),
  scanReceipt: (imageBase64: string) => request<ScannedReceipt>("/receipts/scan", { method: "POST", body: JSON.stringify({ imageBase64 }) }),
  receiptUrl: async (receiptId: string) => (await request<{ url: string }>(`/receipts/${receiptId}/url`)).url,
};
