import { SUPPORTED_LANGUAGES, type Language } from "@/lib/i18n/types";

export const DEFAULT_LANGUAGE: Language = "ja";
export const GUEST_LANGUAGE_STORAGE_KEY = "nal_guest_language";

export function parseLanguage(value: unknown): Language {
  if (
    typeof value === "string" &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  ) {
    return value as Language;
  }
  return DEFAULT_LANGUAGE;
}
