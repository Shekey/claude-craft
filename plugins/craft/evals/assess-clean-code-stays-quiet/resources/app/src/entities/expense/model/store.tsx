import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { expenseApi } from "../api/expenseApi";
import type { Expense } from "./types";

export type ExpensesStatus = { kind: "loading" } | { kind: "ready"; expenses: Expense[] } | { kind: "failed" };

type ExpensesState = { status: ExpensesStatus; refresh: () => Promise<Expense[] | null> };

const ExpensesContext = createContext<ExpensesState | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ExpensesStatus>({ kind: "loading" });

  const refresh = useCallback(async () => {
    try {
      const expenses = await expenseApi.list();
      setStatus({ kind: "ready", expenses });
      return expenses;
    } catch {
      setStatus((current) => (current.kind === "ready" ? current : { kind: "failed" }));
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <ExpensesContext.Provider value={{ status, refresh }}>{children}</ExpensesContext.Provider>;
}

export function useExpenses() {
  const value = useContext(ExpensesContext);
  if (!value) throw new Error("useExpenses must be used inside ExpensesProvider");
  return value;
}
