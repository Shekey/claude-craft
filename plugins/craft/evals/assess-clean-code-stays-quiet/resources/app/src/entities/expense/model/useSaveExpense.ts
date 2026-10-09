import { useState } from "react";
import { track } from "../../../shared/lib";
import { expenseApi } from "../api/expenseApi";
import { isOverMonthlyLimit } from "./categories";
import type { ExpenseFields } from "./draft";
import type { ReceiptChange } from "./receipt";
import { useExpenses } from "./store";

export type SaveOutcome = { kind: "saved"; overBudget: boolean };

export function useSaveExpense() {
  const { refresh } = useExpenses();
  const [saving, setSaving] = useState(false);

  const save = async (existingId: string | null, fields: ExpenseFields, receipt: ReceiptChange): Promise<SaveOutcome> => {
    setSaving(true);
    try {
      if (existingId) await expenseApi.update(existingId, fields, receipt);
      else await expenseApi.create(fields, receipt);
    } finally {
      setSaving(false);
    }
    if (!existingId) track("expense_added", { withReceipt: "receiptBase64" in receipt, category: fields.category });
    const latest = await refresh();
    return { kind: "saved", overBudget: latest !== null && isOverMonthlyLimit(latest, fields.category, fields.date.slice(0, 7)) };
  };

  return { save, saving };
}
