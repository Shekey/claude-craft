import { http } from "./http";

export type Profile = { name: string; email: string; avatarUrl: string | null };

export const getProfile = () => http.get<Profile>("/me");
export const updateProfile = (p: Pick<Profile, "name">) => http.put<Profile>("/me", p);
