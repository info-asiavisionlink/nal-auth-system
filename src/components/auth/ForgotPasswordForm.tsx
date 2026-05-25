"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { NeonButton } from "@/components/ui/NeonButton";
import { createClient } from "@/lib/supabase";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("メールアドレスを入力してください。");
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
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="パスワード再設定"
      subtitle="登録済みのメールアドレスに再設定用リンクを送信します"
      footer={
        <p className="text-slate-600">
          <Link
            href="/login"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            ログインに戻る
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <InputField
          label="メールアドレス"
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
            再設定用メールを送信しました。メール内のリンクから新しいパスワードを設定してください。
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
            再設定メールを送信
          </NeonButton>
        ) : null}
      </form>
    </AuthLayout>
  );
}
