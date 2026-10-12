import type { Plan } from "./purchases";

export const MAX_HABITS: Record<Plan["id"], number> = { free: 3, plus: 50 };
export const canAddHabit = (plan: Plan["id"], count: number) => count < MAX_HABITS[plan];
