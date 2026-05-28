import { DEFAULT_LANGUAGE, parseLanguage } from "@/lib/i18n/constants";
import type { Language } from "@/lib/i18n/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolveProfileLanguageResult = {
  language: Language;
  /** metadata から profiles へ同期が必要な場合 true */
  syncedFromMetadata: boolean;
};

/**
 * ログイン済みユーザーの表示言語を決定する。
 * profiles.preferred_language を正とし、未保存時のみ signup metadata から補完する。
 */
export function resolvePreferredLanguageFromSources(
  profileValue: unknown,
  metadataValue: unknown,
): { language: Language; syncToProfile: boolean } {
  const profile = parseLanguage(profileValue);
  const metadata =
    metadataValue !== undefined && metadataValue !== null && metadataValue !== ""
      ? parseLanguage(metadataValue)
      : null;

  if (metadata && profile === DEFAULT_LANGUAGE && metadata !== profile) {
    return { language: metadata, syncToProfile: true };
  }

  return { language: profile, syncToProfile: false };
}

export async function resolveAuthenticatedLanguage(
  supabase: SupabaseClient,
  userId: string,
): Promise<ResolveProfileLanguageResult> {
  const [{ data: profile, error: profileError }, { data: userData, error: userError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", userId)
        .maybeSingle(),
      supabase.auth.getUser(),
    ]);

  if (profileError) {
    console.warn("[resolveAuthenticatedLanguage] profile fetch failed", profileError.message);
  }
  if (userError) {
    console.warn("[resolveAuthenticatedLanguage] user fetch failed", userError.message);
  }

  const metadataValue = userData.user?.user_metadata?.preferred_language;
  const { language, syncToProfile } = resolvePreferredLanguageFromSources(
    profile?.preferred_language,
    metadataValue,
  );

  if (syncToProfile) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ preferred_language: language })
      .eq("id", userId);

    if (updateError) {
      console.warn(
        "[resolveAuthenticatedLanguage] metadata → profile sync failed",
        updateError.message,
      );
      return { language, syncedFromMetadata: false };
    }

    return { language, syncedFromMetadata: true };
  }

  return { language, syncedFromMetadata: false };
}
