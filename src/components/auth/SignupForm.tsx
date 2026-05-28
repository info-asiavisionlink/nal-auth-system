"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupErrorPanel } from "@/components/auth/SignupErrorPanel";
import { LanguageSelect } from "@/components/common/LanguageSelect";
import { InputField } from "@/components/ui/InputField";
import { PasswordInputField } from "@/components/ui/PasswordInputField";
import { NeonButton } from "@/components/ui/NeonButton";
import {
  mapSignupErrorMessage,
  validateSignupInputLocalized,
} from "@/lib/i18n/get-language";
import { saveSignupPreferredLanguage } from "@/lib/i18n/save-signup-language";
import { t } from "@/lib/i18n/translations";
import type { Language } from "@/lib/i18n/types";
import {
  formatGenericDisplay,
  type SignupDisplayError,
} from "@/lib/signup-debug";
import { createClient } from "@/lib/supabase";
import type { AuthError } from "@supabase/supabase-js";

export function SignupForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<Language>("ja");
  const [displayError, setDisplayError] = useState<SignupDisplayError | null>(
    null,
  );
  const [emailSent, setEmailSent] = useState(false);
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    console.log("[signup] 入力値チェック開始");

    const validationError = validateSignupInputLocalized(
      username,
      email,
      password,
      preferredLanguage,
    );
    if (validationError) {
      console.log("[signup] 入力値チェック失敗:", validationError);
      setEmailSent(false);
      setEmailAlreadyExists(false);
      setDisplayError(
        formatGenericDisplay(
          t("signupValidationFailed", preferredLanguage),
          validationError,
        ),
      );
      return;
    }

    console.log("[signup] 入力値チェック成功");

    setLoading(true);
    setDisplayError(null);
    setEmailSent(false);
    setEmailAlreadyExists(false);

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    try {
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const checkResult = (await checkResponse.json()) as {
        exists?: boolean;
        error?: string;
      };

      if (!checkResponse.ok) {
        setDisplayError(
          formatGenericDisplay(
            t("signupFailed", preferredLanguage),
            checkResult.error ?? t("signupEmailCheckFailed", preferredLanguage),
          ),
        );
        return;
      }

      if (checkResult.exists) {
        setEmailAlreadyExists(true);
        return;
      }

      const supabase = createClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback`;

      console.log("[signup] supabase.auth.signUp 実行");
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            username: trimmedUsername,
            preferred_language: preferredLanguage,
          },
        },
      });

      console.log("SIGNUP_DATA", data);

      if (error) {
        console.error("SIGNUP_ERROR", error);
        console.log("[signup] signUp 失敗");
        const authMessage = mapSignupErrorMessage(
          (error as AuthError).message,
          preferredLanguage,
        );
        setDisplayError(
          formatGenericDisplay(
            t("signupFailed", preferredLanguage),
            authMessage,
          ),
        );
        return;
      }

      console.log("[signup] signUp 成功", {
        userId: data.user?.id ?? null,
        hasSession: Boolean(data.session),
      });

      await saveSignupPreferredLanguage(
        supabase,
        data.user?.id,
        preferredLanguage,
      );

      setEmailSent(true);
    } catch (error) {
      console.error("SIGNUP_UNEXPECTED_ERROR", error);
      const message =
        error instanceof Error ? error.message : "Unknown error";
      setDisplayError(
        formatGenericDisplay(
          t("signupFailed", preferredLanguage),
          message,
          error instanceof Error ? error.stack : undefined,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={t("signupTitle", preferredLanguage)}
      subtitle={t("signupSubtitle", preferredLanguage)}
      footer={
        <p className="text-slate-600">
          {t("hasAccount", preferredLanguage)}{" "}
          <Link
            href="/login"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            {t("login", preferredLanguage)}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <LanguageSelect
          value={preferredLanguage}
          onChange={setPreferredLanguage}
          label={t("language", preferredLanguage)}
          disabled={loading || emailSent || emailAlreadyExists}
          id="signup-language-select"
        />
        <InputField
          label={t("username", preferredLanguage)}
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your_name"
          autoComplete="username"
          required
          disabled={loading || emailSent || emailAlreadyExists}
        />
        <InputField
          label={t("email", preferredLanguage)}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={loading || emailSent || emailAlreadyExists}
        />
        <PasswordInputField
          label={t("password", preferredLanguage)}
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder", preferredLanguage)}
          autoComplete="new-password"
          minLength={6}
          required
          disabled={loading || emailSent || emailAlreadyExists}
        />

        {emailAlreadyExists ? (
          <div
            className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950"
            role="alert"
          >
            <p className="font-semibold">
              {t("signupEmailExists", preferredLanguage)}
            </p>
            <Link
              href="/login"
              className="inline-block font-semibold text-sky-700 hover:text-sky-800"
            >
              {t("goToLogin", preferredLanguage)}
            </Link>
          </div>
        ) : null}

        {emailSent ? (
          <div
            className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900"
            role="status"
          >
            <p className="font-semibold">
              {t("emailSentTitle", preferredLanguage)}
            </p>
            <p className="leading-relaxed">
              {t("emailSentBody", preferredLanguage)}
            </p>
            <p className="leading-relaxed">
              {t("emailSentAfterVerify", preferredLanguage)}
            </p>
            <Link
              href="/login"
              className="inline-block font-semibold text-sky-700 hover:text-sky-800"
            >
              {t("goToLogin", preferredLanguage)}
            </Link>
          </div>
        ) : null}

        {displayError ? (
          <SignupErrorPanel error={displayError} language={preferredLanguage} />
        ) : null}

        {!emailSent && !emailAlreadyExists ? (
          <NeonButton
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {t("signupSubmit", preferredLanguage)}
          </NeonButton>
        ) : null}
      </form>
    </AuthLayout>
  );
}
