export {
  DEFAULT_LANGUAGE,
  GUEST_LANGUAGE_STORAGE_KEY,
  parseLanguage,
  readGuestLanguage,
  writeGuestLanguage,
  mapLoginErrorMessage,
  mapSignupErrorMessage,
  validateSignupInputLocalized,
} from "@/lib/i18n/get-language";
export { t, translations, type TranslationKey, type TranslationParams } from "@/lib/i18n/translations";
export {
  LANGUAGE_OPTIONS,
  SUPPORTED_LANGUAGES,
  type Language,
  type LanguageOption,
} from "@/lib/i18n/types";
