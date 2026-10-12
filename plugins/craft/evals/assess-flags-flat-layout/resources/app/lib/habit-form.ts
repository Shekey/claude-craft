import type { Frequency, Habit } from "./habit-types";

export type HabitDraft = { name: string; frequency: Frequency; reminderAt: string | null };

export const emptyDraft = (): HabitDraft => ({ name: "", frequency: { kind: "daily" }, reminderAt: null });
export const draftFromHabit = (h: Habit): HabitDraft => ({ name: h.name, frequency: h.frequency, reminderAt: h.reminderAt });
export const habitFromDraft = (id: string, d: HabitDraft): Habit => ({ id, ...d, archived: false });
export const validateDraft = (d: HabitDraft) => (d.name.trim() ? null : "Name is required");
