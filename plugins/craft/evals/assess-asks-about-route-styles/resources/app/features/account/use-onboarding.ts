import { useState } from "react";
import { saveProfile } from "../../shared/storage";

export type OnboardingError = { title: string; body: string; ref?: string };

/** Saves the comfort baseline and marks onboarding done. Returns false when saving failed. */
export function useOnboarding() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<OnboardingError | null>(null);
  const finish = async (coldC: number): Promise<boolean> => {
    setBusy(true);
    setErr(null);
    try {
      await saveProfile({ coldC, onboarded: true });
      return true;
    } catch (e) {
      setErr({ title: "Couldn't save your answers", body: "Try again in a moment.", ref: e instanceof Error ? e.name : undefined });
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { finish, busy, err };
}
