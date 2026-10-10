export type Frequency = { kind: "daily" } | { kind: "weekly"; days: number[] };

export type Habit = { id: string; name: string; frequency: Frequency; reminderAt: string | null; archived: boolean };

export type CheckIn = { habitId: string; date: string };
