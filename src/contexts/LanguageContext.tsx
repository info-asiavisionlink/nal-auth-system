"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  parseLanguage,
  readGuestLanguage,
  subscribeGuestLanguage,
  writeGuestLanguage,
} from "@/lib/i18n/get-language";
import { t, type TranslationKey, type TranslationParams } from "@/lib/i18n/translations";
import type { Language } from "@/lib/i18n/types";
import { createClient } from "@/lib/supabase";

type LanguageContextValue = {
  language: Language;
  ready: boolean;
  updating: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  translate: (key: TranslationKey, params?: TranslationParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
  initialLanguage?: Language;
  userId?: string;
};

export function LanguageProvider({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
  userId,
}: LanguageProviderProps) {
  const [profileLanguageOverride, setProfileLanguageOverride] =
    useState<Language | null>(null);
  const [updating, setUpdating] = useState(false);

  const guestLanguage = useSyncExternalStore(
    subscribeGuestLanguage,
    readGuestLanguage,
    () => DEFAULT_LANGUAGE,
  );

  const profileLanguage = profileLanguageOverride ?? parseLanguage(initialLanguage);
  const language = userId ? profileLanguage : guestLanguage;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const ready = true;

  const setLanguage = useCallback(
    async (lang: Language) => {
      const next = parseLanguage(lang);
      writeGuestLanguage(next);

      if (!userId) return;

      setProfileLanguageOverride(next);
      setUpdating(true);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("profiles")
          .update({ preferred_language: next })
          .eq("id", userId);

        if (error) {
          console.error("[LanguageProvider] preferred_language update failed", error);
        }
      } finally {
        setUpdating(false);
      }
    },
    [userId],
  );

  const translate = useCallback(
    (key: TranslationKey, params?: TranslationParams) => t(key, language, params),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      ready,
      updating,
      setLanguage,
      translate,
    }),
    [language, ready, updating, setLanguage, translate],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
