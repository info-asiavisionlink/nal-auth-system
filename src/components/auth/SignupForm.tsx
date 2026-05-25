"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupErrorPanel } from "@/components/auth/SignupErrorPanel";
import { InputField } from "@/components/ui/InputField";
import { PasswordInputField } from "@/components/ui/PasswordInputField";
import { NeonButton } from "@/components/ui/NeonButton";
import { validateSignupInput } from "@/lib/auth-errors";
import {
  formatAuthErrorDisplay,
  formatGenericDisplay,
  type SignupDisplayError,
} from "@/lib/signup-debug";
import { createClient } from "@/lib/supabase";
import type { AuthError } from "@supabase/supabase-js";

export function SignupForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const validationError = validateSignupInput(username, email, password);
    if (validationError) {
      console.log("[signup] 入力値チェック失敗:", validationError);
      setEmailSent(false);
      setEmailAlreadyExists(false);
      setDisplayError(
        formatGenericDisplay("入力内容を確認してください。", validationError),
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
            "登録に失敗しました。",
            checkResult.error ?? "メールアドレスの確認に失敗しました。",
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
          },
        },
      });

      console.log("SIGNUP_DATA", data);

      if (error) {
        console.error("SIGNUP_ERROR", error);
        console.log("[signup] signUp 失敗");
        setDisplayError(formatAuthErrorDisplay(error as AuthError));
        return;
      }

      console.log("[signup] signUp 成功", {
        userId: data.user?.id ?? null,
        hasSession: Boolean(data.session),
      });

      setEmailSent(true);
    } catch (error) {
      console.error("SIGNUP_UNEXPECTED_ERROR", error);
      const message =
        error instanceof Error ? error.message : "不明なエラーが発生しました";
      setDisplayError(
        formatGenericDisplay(
          "登録に失敗しました。",
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
      title="新規登録"
      subtitle="アカウントを作成してダッシュボードへ"
      footer={
        <p className="text-slate-600">
          すでにアカウントをお持ちですか？{" "}
          <Link
            href="/login"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            ログイン
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <InputField
          label="ユーザー名"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your_name"
          autoComplete="username"
          required
          disabled={loading || emailSent || emailAlreadyExists}
        />
        <InputField
          label="メールアドレス"
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
          label="パスワード"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6文字以上"
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
              このメールアドレスはすでに登録されています。ログインしてください。
            </p>
            <Link
              href="/login"
              className="inline-block font-semibold text-sky-700 hover:text-sky-800"
            >
              ログインページへ
            </Link>
          </div>
        ) : null}

        {emailSent ? (
          <div
            className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900"
            role="status"
          >
            <p className="font-semibold">確認メールを送信しました</p>
            <p className="leading-relaxed">
              入力したメールアドレス宛に届いた認証リンクをクリックしてください。
            </p>
            <p className="leading-relaxed">
              認証完了後、ログインページからログインできます。
            </p>
            <Link
              href="/login"
              className="inline-block font-semibold text-sky-700 hover:text-sky-800"
            >
              ログインページへ
            </Link>
          </div>
        ) : null}

        {displayError ? <SignupErrorPanel error={displayError} /> : null}

        {!emailSent && !emailAlreadyExists ? (
          <NeonButton
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            アカウントを作成
          </NeonButton>
        ) : null}
      </form>
    </AuthLayout>
  );
}
