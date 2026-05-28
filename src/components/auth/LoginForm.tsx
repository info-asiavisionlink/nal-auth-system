"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { PasswordInputField } from "@/components/ui/PasswordInputField";
import { NeonButton } from "@/components/ui/NeonButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { isEmailConfirmed } from "@/lib/auth-email";
import { SESSION_PASSWORD_KEY } from "@/lib/auth-errors";
import { mapLoginErrorMessage } from "@/lib/i18n/get-language";
import type { TranslationKey } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase";

function getStatusMessageKey(searchParams: URLSearchParams): TranslationKey | null {
  if (searchParams.get("verified") === "1") {
    return "emailVerified";
  }
  if (searchParams.get("error") === "auth_callback_failed") {
    return "authCallbackFailed";
  }
  if (searchParams.get("error") === "email_not_confirmed") {
    return "emailNotConfirmed";
  }
  if (searchParams.get("reset") === "success") {
    return "resetSuccess";
  }
  return null;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { translate, language } = useLanguage();
  const statusMessageKey = getStatusMessageKey(searchParams);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (!email.trim() || !password) {
      setError(translate("loginRequiredFields"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(mapLoginErrorMessage(signInError.message, language));
        return;
      }

      const user = data.user;
      if (!user || !isEmailConfirmed(user)) {
        await supabase.auth.signOut();
        setError(translate("emailNotConfirmed"));
        return;
      }

      sessionStorage.setItem(SESSION_PASSWORD_KEY, password);

      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(translate("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={translate("loginTitle")}
      subtitle={translate("loginSubtitle")}
      footer={
        <p className="text-slate-600">
          {translate("noAccount")}{" "}
          <Link
            href="/signup"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            {translate("signup")}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {statusMessageKey ? (
          <p
            className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
            role="status"
          >
            {translate(statusMessageKey)}
          </p>
        ) : null}

        <InputField
          label={translate("email")}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={loading}
        />
        <PasswordInputField
          label={translate("password")}
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={loading}
        />

        {error ? (
          <p
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <NeonButton
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          {translate("loginSubmit")}
        </NeonButton>

        <p className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            {translate("forgotPasswordLink")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
