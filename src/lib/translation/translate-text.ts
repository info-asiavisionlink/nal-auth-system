import type { Language } from "@/lib/i18n/types";

/**
 * Placeholder for future Google Cloud Translation API integration.
 * Dynamic text (e.g. tool descriptions) will be translated here.
 *
 * Required env (see .env.local.example):
 * - GOOGLE_CLOUD_PROJECT_ID
 * - GOOGLE_TRANSLATION_API_KEY
 */
export async function translateText(
  text: string,
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string> {
  void text;
  void targetLanguage;
  void sourceLanguage;
  throw new Error(
    "translateText is not implemented yet. Use translations.ts for fixed UI copy.",
  );
}
