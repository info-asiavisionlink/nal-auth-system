import {
  DEFAULT_LANGUAGE,
  GUEST_LANGUAGE_STORAGE_KEY,
  parseLanguage,
} from "@/lib/i18n/constants";
import { t } from "@/lib/i18n/translations";
import type { Language } from "@/lib/i18n/types";

export { DEFAULT_LANGUAGE, GUEST_LANGUAGE_STORAGE_KEY, parseLanguage };

export function readGuestLanguage(): Language {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  return parseLanguage(localStorage.getItem(GUEST_LANGUAGE_STORAGE_KEY));
}

const GUEST_LANGUAGE_CHANGE_EVENT = "nal-guest-language-change";

export function writeGuestLanguage(lang: Language): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_LANGUAGE_STORAGE_KEY, lang);
  window.dispatchEvent(new Event(GUEST_LANGUAGE_CHANGE_EVENT));
}

export function subscribeGuestLanguage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === GUEST_LANGUAGE_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(GUEST_LANGUAGE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(GUEST_LANGUAGE_CHANGE_EVENT, onStoreChange);
  };
}

export function mapLoginErrorMessage(message: string, lang: Language): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials") ||
    lower.includes("wrong password")
  ) {
    return t("loginInvalid", lang);
  }

  if (lower.includes("user not found")) {
    return t("loginNotRegistered", lang);
  }

  if (lower.includes("email not confirmed")) {
    return t("loginEmailNotConfirmed", lang);
  }

  return t("loginInvalid", lang);
}

export function mapSignupErrorMessage(message: string, lang: Language): string {
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("already exists")) {
    return t("signupAlreadyRegistered", lang);
  }

  if (lower.includes("password")) {
    return t("validationPasswordMin", lang);
  }

  if (lower.includes("valid email")) {
    return t("validationEmailInvalid", lang);
  }

  return t("signupGenericFailed", lang);
}

export function validateSignupInputLocalized(
  username: string,
  email: string,
  password: string,
  lang: Language,
): string | null {
  if (!username.trim()) {
    return t("validationUsernameRequired", lang);
  }
  if (!email.trim()) {
    return t("validationEmailRequired", lang);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return t("validationEmailInvalid", lang);
  }
  if (password.length < 6) {
    return t("validationPasswordMin", lang);
  }
  return null;
}
