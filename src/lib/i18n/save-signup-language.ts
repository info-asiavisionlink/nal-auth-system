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

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { preferred_language: language },
  });

  if (metadataError) {
    console.warn("[signup] auth metadata preferred_language skipped", metadataError.message);
  }

  if (!userId) return;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ preferred_language: language })
    .eq("id", userId);

  if (updateError) {
    console.warn("[signup] profiles.preferred_language update skipped", updateError.message);
  }
}
