import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, type Expense } from "./api";

type AppState = { expenses: Expense[] | null; refreshExpenses: () => Promise<void> };

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const refreshExpenses = useCallback(async () => setExpenses(await api.listExpenses()), []);
  useEffect(() => {
    refreshExpenses();
  }, [refreshExpenses]);
  return <AppContext.Provider value={{ expenses, refreshExpenses }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
