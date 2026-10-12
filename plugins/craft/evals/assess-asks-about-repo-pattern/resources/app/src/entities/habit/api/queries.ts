import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../../shared/api";
import type { CheckIn, Habit } from "../model/types";

export const useHabits = () => useQuery({ queryKey: ["habits"], queryFn: () => http.get<(Habit & { streak: number })[]>("/habits") });
export const useHabit = (id: string) => useQuery({ queryKey: ["habits", id], queryFn: () => http.get<Habit>(`/habits/${id}`) });
export const useCheckIns = (id: string) => useQuery({ queryKey: ["check-ins", id], queryFn: () => http.get<CheckIn[]>(`/habits/${id}/check-ins`) });

export function useCheckIn(habitId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => http.post<CheckIn>(`/habits/${habitId}/check-ins`, { date }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["check-ins", habitId] }),
  });
}
