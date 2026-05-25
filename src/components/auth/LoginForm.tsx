"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { PasswordInputField } from "@/components/ui/PasswordInputField";
import { NeonButton } from "@/components/ui/NeonButton";
import { mapLoginError, SESSION_PASSWORD_KEY } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(mapLoginError(signInError.message));
        return;
      }

      sessionStorage.setItem(SESSION_PASSWORD_KEY, password);

      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="ログイン"
      subtitle="登録済みのアカウントでサインイン"
      footer={
        <p className="text-slate-600">
          アカウントをお持ちでない方は{" "}
          <Link
            href="/signup"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            新規登録
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
          disabled={loading}
        />
        <PasswordInputField
          label="パスワード"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={loading}
        />

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}

        <NeonButton
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          ログイン
        </NeonButton>
      </form>
    </AuthLayout>
  );
}
