"use client";

import { useEffect, useMemo, useState } from "react";
import type { Language } from "@/lib/i18n/types";
import type { Tool } from "@/types/tool";
import {
  applyToolTextTranslations,
  collectUniqueToolTexts,
  getClientTranslationCacheKey,
} from "@/lib/translation/tool-texts";

const clientTranslationCache = new Map<string, string>();

async function fetchTranslations(
  texts: string[],
  targetLanguage: Language,
): Promise<string[]> {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, targetLanguage }),
  });

  if (!response.ok) {
    throw new Error(`Translate API failed (${response.status})`);
  }

  const payload = (await response.json()) as { translations?: string[] };
  if (!Array.isArray(payload.translations)) {
    throw new Error("Invalid translate API response");
  }

  return payload.translations;
}

/**
 * スプレッドシート由来ツールの表示用テキストを翻訳する。
 * ja の場合は API を呼ばず originalTools をそのまま返す。
 */
export function useTranslatedTools(originalTools: Tool[], language: Language) {
  const [translatedOverride, setTranslatedOverride] = useState<Tool[] | null>(
    null,
  );
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (language === "ja") {
      return;
    }

    let cancelled = false;

    async function run() {
      setTranslating(true);
      setTranslatedOverride(null);

      try {
        const uniqueTexts = collectUniqueToolTexts(originalTools);
        const uncached: string[] = [];

        for (const text of uniqueTexts) {
          const cacheKey = getClientTranslationCacheKey(language, text);
          if (!clientTranslationCache.has(cacheKey)) {
            uncached.push(text);
          }
        }

        if (uncached.length > 0) {
          const translated = await fetchTranslations(uncached, language);
          for (let index = 0; index < uncached.length; index += 1) {
            const source = uncached[index];
            const result = translated[index] ?? source;
            clientTranslationCache.set(
              getClientTranslationCacheKey(language, source),
              result,
            );
          }
        }

        const lookup = new Map<string, string>();
        for (const text of uniqueTexts) {
          lookup.set(
            text,
            clientTranslationCache.get(getClientTranslationCacheKey(language, text)) ??
              text,
          );
        }

        if (!cancelled) {
          setTranslatedOverride(applyToolTextTranslations(originalTools, lookup));
        }
      } catch (error) {
        console.warn("[useTranslatedTools] fallback to Japanese", error);
        if (!cancelled) {
          setTranslatedOverride(originalTools);
        }
      } finally {
        if (!cancelled) {
          setTranslating(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [originalTools, language]);

  const translatedTools = useMemo(() => {
    if (language === "ja") {
      return originalTools;
    }
    return translatedOverride ?? originalTools;
  }, [language, originalTools, translatedOverride]);

  return {
    translatedTools,
    translating: language !== "ja" && translating,
  };
}
