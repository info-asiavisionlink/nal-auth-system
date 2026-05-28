"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { NeonButton } from "@/components/ui/NeonButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase";

export function ForgotPasswordForm() {
  const { translate } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(translate("forgotEmailRequired"));
      return;
    }

    setLoading(true);
    setError(null);
    setEmailSent(false);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        { redirectTo },
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setEmailSent(true);
    } catch {
      setError(translate("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={translate("forgotPasswordTitle")}
      subtitle={translate("forgotPasswordSubtitle")}
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
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <InputField
          label={translate("email")}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={loading || emailSent}
        />

        {emailSent ? (
          <p
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            {translate("forgotEmailSent")}
          </p>
        ) : null}

        {error ? (
          <p
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {!emailSent ? (
          <NeonButton
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {translate("forgotPasswordSubmit")}
          </NeonButton>
        ) : null}
      </form>
    </AuthLayout>
  );
}
