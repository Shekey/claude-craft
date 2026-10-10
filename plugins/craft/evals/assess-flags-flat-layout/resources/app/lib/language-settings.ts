import { storage } from "./storage";
import type { LanguageCode } from "./language";

export const loadLanguage = async () => (await storage.get<LanguageCode>("language")) ?? "en";
export const saveLanguage = (code: LanguageCode) => storage.set("language", code);
