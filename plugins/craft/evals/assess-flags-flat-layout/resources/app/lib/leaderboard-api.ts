import { http } from "./http";

export type LeaderboardRow = { name: string; streak: number };

export const getLeaderboard = () => http.get<LeaderboardRow[]>("/leaderboard");
