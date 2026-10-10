import { storage } from "./storage";

export type PrivacySettings = { shareAnalytics: boolean; showOnLeaderboard: boolean };

export const loadPrivacy = async () => (await storage.get<PrivacySettings>("privacy")) ?? { shareAnalytics: true, showOnLeaderboard: false };
export const savePrivacy = (s: PrivacySettings) => storage.set("privacy", s);
