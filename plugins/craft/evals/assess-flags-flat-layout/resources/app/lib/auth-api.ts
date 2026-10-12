import { http } from "./http";
import type { Session } from "./auth-session";

export const signIn = (email: string, password: string) => http.post<Session>("/auth/sign-in", { email, password });
export const signOut = () => http.post<void>("/auth/sign-out", {});
