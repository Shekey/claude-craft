import { http } from "./http";

export type Plan = { id: "free" | "plus"; price: string };

export const listPlans = () => http.get<Plan[]>("/billing/plans");
export const subscribe = (planId: Plan["id"]) => http.post<void>("/billing/subscribe", { planId });
