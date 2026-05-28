import type { Language } from "@/lib/i18n/types";
import { writeGuestLanguage } from "@/lib/i18n/get-language";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 新規登録時に preferred_language を保存する（追加のみ）。
 * Auth metadata と profiles 行の両方へ反映を試みる。
 */
export async function saveSignupPreferredLanguage(
  supabase: SupabaseClient,
  userId: string | undefined,
  language: Language,
): Promise<void> {
  writeGuestLanguage(language);

  if (!userId) return;

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_language: language })
    .eq("id", userId);

  if (error) {
    console.warn("[signup] preferred_language update skipped", error.message);
  }
}
