export const BADGES = [
  { days: 7, label: "One week" },
  { days: 30, label: "One month" },
  { days: 100, label: "Hundred days" },
];

export const badgeFor = (streak: number) => [...BADGES].reverse().find((b) => streak >= b.days) ?? null;
