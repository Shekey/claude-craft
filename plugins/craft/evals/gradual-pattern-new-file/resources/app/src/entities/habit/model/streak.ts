import { addDays, toDateKey } from "../../../shared/lib";
import type { CheckIn } from "./types";

export function currentStreak(checkIns: CheckIn[], today: Date): number {
  const days = new Set(checkIns.map((c) => c.date));
  let streak = 0;
  for (let d = today; days.has(toDateKey(d)); d = addDays(d, -1)) streak++;
  return streak;
}
