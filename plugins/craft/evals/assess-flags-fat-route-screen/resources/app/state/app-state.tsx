import type { Recommendation } from "@sww/engine";
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { Odds } from "../features/comfort/insight";
import { saveKept } from "../shared/storage";
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

export function AppProvider({ children, initial }: { children: ReactNode; initial?: Partial<AppState> }) {
  const [rec] = useState<AppState["rec"]>(initial?.rec ?? null);
  const [place] = useState<Place | null>(initial?.place ?? null);
  const value = useMemo<AppState>(
    () => ({
      rec,
      place,
      units: initial?.units ?? "metric",
      plan: initial?.plan ?? { home: new Date() },
      insight: initial?.insight ?? null,
      keepOutfit: (recId, home, via) => saveKept({ recId, home: home.toISOString(), via }),
    }),
    [rec, place, initial],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const app = useContext(AppContext);
  if (!app) throw new Error("useApp needs AppProvider");
  return app;
}
