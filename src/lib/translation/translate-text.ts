import type { Language } from "@/lib/i18n/types";
import { translateTexts } from "@/lib/translation/translate-texts";

/**
 * 単一テキスト翻訳（サーバー専用）。
 * クライアントからは /api/translate を利用してください。
 */
export async function translateText(
  text: string,
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string> {
  void sourceLanguage;
  const [result] = await translateTexts([text], targetLanguage);
  return result ?? text;
}
