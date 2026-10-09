import { useEffect, useState } from "react";
import { expenseApi } from "../api/expenseApi";
import type { Receipt } from "./receipt";
import type { Expense } from "./types";

export function useReceipt(expense: Expense | null): Receipt | undefined {
  const receiptId = expense?.receiptId;
  const [loaded, setLoaded] = useState<{ forId: string; receipt: Receipt }>();

  useEffect(() => {
    if (!receiptId) return;
    let active = true;
    expenseApi
      .receiptUrl(receiptId)
      .then((url): Receipt => ({ kind: "saved", id: receiptId, url }))
      .catch((): Receipt => ({ kind: "saved-unavailable", id: receiptId }))
      .then((receipt) => active && setLoaded({ forId: receiptId, receipt }));
    return () => {
      active = false;
    };
  }, [receiptId]);

  if (!receiptId) return { kind: "none" };
  return loaded?.forId === receiptId ? loaded.receipt : undefined;
}
