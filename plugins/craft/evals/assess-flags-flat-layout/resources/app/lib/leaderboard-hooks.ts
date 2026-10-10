import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "./leaderboard-api";

export const useLeaderboard = () => useQuery({ queryKey: ["leaderboard"], queryFn: getLeaderboard });
