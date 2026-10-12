import { storage } from "./storage";
import type { ThemeName } from "./theme";

export const loadTheme = async () => (await storage.get<ThemeName>("theme")) ?? "system";
export const saveTheme = (t: ThemeName) => storage.set("theme", t);
