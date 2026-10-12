import { http } from "./http";
import type { CheckIn, Habit } from "./habit-types";

export const listHabits = () => http.get<Habit[]>("/habits");
export const getHabit = (id: string) => http.get<Habit>(`/habits/${id}`);
export const saveHabit = (habit: Habit) => http.put<Habit>(`/habits/${habit.id}`, habit);
export const archiveHabit = (id: string) => http.post<void>(`/habits/${id}/archive`, {});
export const listCheckIns = (habitId: string) => http.get<CheckIn[]>(`/habits/${habitId}/check-ins`);
export const checkIn = (habitId: string, date: string) => http.post<CheckIn>(`/habits/${habitId}/check-ins`, { date });
