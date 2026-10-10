import { useMutation, useQuery } from "@tanstack/react-query";
import { listPlans, subscribe } from "./purchases";

export const usePlans = () => useQuery({ queryKey: ["plans"], queryFn: listPlans });
export const useSubscribe = () => useMutation({ mutationFn: subscribe });
