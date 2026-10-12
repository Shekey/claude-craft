import { storage } from "./storage";

export type NotificationSettings = { enabled: boolean; quietHours: { from: string; to: string } | null };

export const loadNotificationSettings = async () => (await storage.get<NotificationSettings>("notifications")) ?? { enabled: true, quietHours: null };
export const saveNotificationSettings = (s: NotificationSettings) => storage.set("notifications", s);
