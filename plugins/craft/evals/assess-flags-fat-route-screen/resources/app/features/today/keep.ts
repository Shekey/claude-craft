import type { Recommendation } from "@sww/engine";
import { useState } from "react";
import { useApp } from "../../state/app-state";

/** Saves the outfit for today and schedules the "how did it feel" question for when the user is home. */
export function useKeep(rec: Recommendation & { id: string }, home: Date, opts: { via: "screen" | "hero"; onDone: () => void }) {
  const { keepOutfit } = useApp();
  const [busy, setBusy] = useState(false);
  const keep = async () => {
    setBusy(true);
    try {
      await keepOutfit(rec.id, home, opts.via);
      opts.onDone();
    } finally {
      setBusy(false);
    }
  };
  return { keep, busy };
}
