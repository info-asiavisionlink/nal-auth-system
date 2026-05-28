import type { Language } from "@/lib/i18n/types";

/** Google Cloud Translation API の target コード */
export function toGoogleTargetLanguage(lang: Language): string {
  switch (lang) {
    case "ja":
      return "ja";
    case "en":
      return "en";
    case "zh":
      return "zh-CN";
    case "th":
      return "th";
    case "ko":
      return "ko";
    default:
      return "en";
  }
}
