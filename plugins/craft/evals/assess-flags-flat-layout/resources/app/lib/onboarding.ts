import { storage } from "./storage";

export const hasSeenOnboarding = async () => (await storage.get<boolean>("onboarding")) === true;
export const markOnboardingSeen = () => storage.set("onboarding", true);
