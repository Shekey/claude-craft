import type { Recommendation } from "@sww/engine";
import { useState } from "react";
import { Alert } from "react-native";
import { useApp } from "../../state/app-state";

/** Saves the outfit for today and schedules the "how did it feel" question for when the user is home. */
export function useKeep(rec: Recommendation & { id: string }, home: Date, opts: { via: "screen" | "hero"; onDone: () => void }) {
  const { keepOutfit } = useApp();
  const [busy, setBusy] = useState(false);
  const keep = async () => {
    setBusy(true);
    try {
      await keepOutfit(rec.id, home, opts.via);
      setBusy(false);
      opts.onDone();
    } catch {
      setBusy(false);
      Alert.alert("Couldn't save", "Check your connection and try again.");
    }
  };
  return { keep, busy };
}
