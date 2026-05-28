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
import { resolveAuthenticatedLanguage } from "@/lib/i18n/resolve-profile-language";
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
  /** SSR からのヒント（表示確定前は使用しない） */
  initialLanguage?: Language;
  userId?: string;
};

export function LanguageProvider({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
  userId,
}: LanguageProviderProps) {
  const isAuthenticated = Boolean(userId);
  const [authenticatedLanguage, setAuthenticatedLanguage] = useState<Language | null>(
    null,
  );
  const [ready, setReady] = useState(!isAuthenticated);
  const [updating, setUpdating] = useState(false);

  const guestLanguage = useSyncExternalStore(
    subscribeGuestLanguage,
    readGuestLanguage,
    () => DEFAULT_LANGUAGE,
  );

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadProfileLanguage() {
      const supabase = createClient();
      const activeUserId = userId;
      if (!activeUserId) return;

      const { language: resolved } = await resolveAuthenticatedLanguage(
        supabase,
        activeUserId,
      );

      if (cancelled) return;

      setAuthenticatedLanguage(resolved);
      writeGuestLanguage(resolved);
      setReady(true);
    }

    void loadProfileLanguage();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const language = isAuthenticated
    ? (authenticatedLanguage ?? parseLanguage(initialLanguage))
    : guestLanguage;

  const displayLanguage = isAuthenticated && !ready ? DEFAULT_LANGUAGE : language;

  useEffect(() => {
    if (isAuthenticated && !ready) return;
    document.documentElement.lang = displayLanguage;
  }, [displayLanguage, isAuthenticated, ready]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      const next = parseLanguage(lang);

      if (!userId) {
        writeGuestLanguage(next);
        return;
      }

      setAuthenticatedLanguage(next);
      writeGuestLanguage(next);
      setUpdating(true);

      try {
        const supabase = createClient();
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ preferred_language: next })
          .eq("id", userId);

        if (profileError) {
          console.error("[LanguageProvider] preferred_language update failed", profileError);
        }

        const { error: metadataError } = await supabase.auth.updateUser({
          data: { preferred_language: next },
        });

        if (metadataError) {
          console.warn("[LanguageProvider] auth metadata update failed", metadataError);
        }
      } finally {
        setUpdating(false);
      }
    },
    [userId],
  );

  const translate = useCallback(
    (key: TranslationKey, params?: TranslationParams) =>
      t(key, displayLanguage, params),
    [displayLanguage],
  );

  const value = useMemo(
    () => ({
      language: displayLanguage,
      ready,
      updating,
      setLanguage,
      translate,
    }),
    [displayLanguage, ready, updating, setLanguage, translate],
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
