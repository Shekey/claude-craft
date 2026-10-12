import type { CheckIn } from "./habit-types";
import { addDays, toDateKey } from "./dates";

export function currentStreak(checkIns: CheckIn[], today: Date): number {
  const days = new Set(checkIns.map((c) => c.date));
  let streak = 0;
  for (let d = today; days.has(toDateKey(d)); d = addDays(d, -1)) streak++;
  return streak;
}
