export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "bs", label: "Bosanski" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
