"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInputField } from "@/components/ui/PasswordInputField";
import { NeonButton } from "@/components/ui/NeonButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase";

const MIN_PASSWORD_LENGTH = 6;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { translate, language } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  function validatePasswords(
    nextPassword: string,
    nextConfirmPassword: string,
  ): string | null {
    if (!nextPassword || !nextConfirmPassword) {
      return translate("resetPasswordRequired");
    }
    if (nextPassword.length < MIN_PASSWORD_LENGTH) {
      return translate("resetPasswordMinLength");
    }
    if (nextPassword !== nextConfirmPassword) {
      return translate("resetPasswordMismatch");
    }
    return null;
  }

  useEffect(() => {
    let cancelled = false;
    const supabaseClient = createClient();

    async function initSession() {
      const code = searchParams.get("code");
      const authError = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (authError) {
        if (!cancelled) {
          setError(errorDescription ?? t("resetLinkInvalid", language));
          setInitializing(false);
        }
        return;
      }

      if (code) {
        const { error: exchangeError } =
          await supabaseClient.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setError(exchangeError.message);
          setInitializing(false);
          return;
        }
      }

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (cancelled) return;
      if (session) {
        setSessionReady(true);
      }
      setInitializing(false);
    }

    initSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") &&
        session
      ) {
        setSessionReady(true);
        setInitializing(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [searchParams, language]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !sessionReady) return;

    const validationError = validatePasswords(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.signOut();
      router.push("/login?reset=success");
      router.refresh();
    } catch {
      setError(translate("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={translate("resetPasswordTitle")}
      subtitle={translate("resetPasswordSubtitle")}
      footer={
        <p className="text-slate-600">
          <Link
            href="/login"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            {translate("backToLogin")}
          </Link>
        </p>
      }
    >
      {initializing ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : !sessionReady ? (
        <div className="space-y-4">
          <p
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {error ?? translate("resetLinkExpired")}
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            {translate("resendResetEmail")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <PasswordInputField
            label={translate("newPassword")}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={translate("passwordPlaceholder")}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            disabled={loading}
          />
          <PasswordInputField
            label={translate("passwordConfirm")}
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={translate("passwordConfirmPlaceholder")}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
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
            {translate("resetPasswordSubmit")}
          </NeonButton>
        </form>
      )}
    </AuthLayout>
  );
}
