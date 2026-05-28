import type { Language } from "@/lib/i18n/types";

const memoryCache = new Map<string, string>();

export function translationCacheKey(lang: Language, text: string): string {
  return `${lang}:${text}`;
}

export function getCachedTranslation(lang: Language, text: string): string | undefined {
  if (!text) return text;
  return memoryCache.get(translationCacheKey(lang, text));
}

export function setCachedTranslation(
  lang: Language,
  sourceText: string,
  translatedText: string,
): void {
  if (!sourceText) return;
  memoryCache.set(translationCacheKey(lang, sourceText), translatedText);
}

export function getManyCached(
  lang: Language,
  texts: string[],
): { hits: Map<string, string>; missing: string[] } {
  const hits = new Map<string, string>();
  const missing: string[] = [];

  for (const text of texts) {
    if (!text) {
      hits.set(text, text);
      continue;
    }

    const cached = getCachedTranslation(lang, text);
    if (cached !== undefined) {
      hits.set(text, cached);
    } else {
      missing.push(text);
    }
  }

  return { hits, missing };
}

/** 将来 Supabase 等へ永続キャッシュする際の差し替えポイント */
export type TranslationCacheStore = {
  get: (lang: Language, text: string) => Promise<string | null>;
  set: (lang: Language, sourceText: string, translatedText: string) => Promise<void>;
};

export const inMemoryTranslationCacheStore: TranslationCacheStore = {
  async get(lang, text) {
    return getCachedTranslation(lang, text) ?? null;
  },
  async set(lang, sourceText, translatedText) {
    setCachedTranslation(lang, sourceText, translatedText);
  },
};
