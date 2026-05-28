export const SUPPORTED_LANGUAGES = ["ja", "en", "zh", "th", "ko"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type LanguageOption = {
  value: Language;
  label: string;
};

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "th", label: "ไทย" },
  { value: "ko", label: "한국어" },
] as const;
