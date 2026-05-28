import { parseLanguage } from "@/lib/i18n/constants";
import type { Language } from "@/lib/i18n/types";
import { toGoogleTargetLanguage } from "@/lib/translation/google-target-language";
import {
  getManyCached,
  inMemoryTranslationCacheStore,
  setCachedTranslation,
  type TranslationCacheStore,
} from "@/lib/translation/translation-cache";

type GoogleTranslateResponse = {
  data?: {
    translations?: Array<{ translatedText?: string }>;
  };
  error?: { message?: string };
};

/**
 * 複数テキストを翻訳する（サーバー専用）。
 * ja の場合は API を呼ばずそのまま返す。
 */
export async function translateTexts(
  texts: string[],
  targetLanguage: Language,
  cacheStore: TranslationCacheStore = inMemoryTranslationCacheStore,
): Promise<string[]> {
  const lang = parseLanguage(targetLanguage);

  if (lang === "ja") {
    return texts.map((text) => text ?? "");
  }

  const normalized = texts.map((text) => text ?? "");
  const { hits, missing } = getManyCached(lang, normalized);

  if (missing.length === 0) {
    return normalized.map((text) => hits.get(text) ?? text);
  }

  const apiKey = process.env.GOOGLE_TRANSLATION_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[translateTexts] GOOGLE_TRANSLATION_API_KEY is not set");
    return normalized;
  }

  let translatedMissing: string[] = [];

  try {
    translatedMissing = await callGoogleTranslateApi(missing, lang, apiKey);
  } catch (error) {
    console.error("[translateTexts] Google API failed", error);
    return normalized;
  }

  for (let index = 0; index < missing.length; index += 1) {
    const source = missing[index];
    const translated = translatedMissing[index] ?? source;
    setCachedTranslation(lang, source, translated);
    await cacheStore.set(lang, source, translated);
    hits.set(source, translated);
  }

  return normalized.map((text) => hits.get(text) ?? text);
}

async function callGoogleTranslateApi(
  texts: string[],
  targetLanguage: Language,
  apiKey: string,
): Promise<string[]> {
  if (texts.length === 0) return [];

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        target: toGoogleTargetLanguage(targetLanguage),
        source: "ja",
        format: "text",
      }),
    },
  );

  const payload = (await response.json()) as GoogleTranslateResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Translation API error (${response.status})`);
  }

  const translations = payload.data?.translations ?? [];
  return texts.map((source, index) => translations[index]?.translatedText ?? source);
}
