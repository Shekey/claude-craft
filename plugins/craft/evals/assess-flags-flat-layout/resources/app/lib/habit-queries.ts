import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkIn, getHabit, listCheckIns, listHabits } from "./habit-api";

export const useHabits = () => useQuery({ queryKey: ["habits"], queryFn: listHabits });
export const useHabit = (id: string) => useQuery({ queryKey: ["habits", id], queryFn: () => getHabit(id) });
export const useCheckIns = (id: string) => useQuery({ queryKey: ["check-ins", id], queryFn: () => listCheckIns(id) });

export function useCheckIn(habitId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => checkIn(habitId, date),
    onSuccess: () => client.invalidateQueries({ queryKey: ["check-ins", habitId] }),
  });
}
