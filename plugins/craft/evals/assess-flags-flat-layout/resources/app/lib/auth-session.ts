import { storage } from "./storage";

export type Session = { userId: string; token: string };

export const loadSession = () => storage.get<Session>("session");
export const saveSession = (s: Session) => storage.set("session", s);
export const clearSession = () => storage.remove("session");
