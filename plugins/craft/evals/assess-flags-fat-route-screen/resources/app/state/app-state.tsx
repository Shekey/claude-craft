import type { Recommendation } from "@sww/engine";
import { createContext, type ReactNode, useContext } from "react";
import type { Odds } from "../features/comfort/insight";
import type { Units } from "../shared/units";

export type Place = { query: string; label: string };

export type AppState = {
  rec: (Recommendation & { id: string }) | null;
  units: Units;
  plan: { home: Date };
  place: Place | null;
  insight: { odds: Odds } | null;
  keepOutfit: (recId: string, home: Date, via: "screen" | "hero") => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children, value }: { children: ReactNode; value?: AppState }) {
  return <AppContext.Provider value={value ?? null}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const app = useContext(AppContext);
  if (!app) throw new Error("useApp needs AppProvider");
  return app;
}
