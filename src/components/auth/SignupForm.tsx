"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupErrorPanel } from "@/components/auth/SignupErrorPanel";
import { InputField } from "@/components/ui/InputField";
import { PasswordInputField } from "@/components/ui/PasswordInputField";
import { NeonButton } from "@/components/ui/NeonButton";
import { SESSION_PASSWORD_KEY, validateSignupInput } from "@/lib/auth-errors";
import {
  formatAuthErrorDisplay,
  formatGenericDisplay,
  type SignupDisplayError,
} from "@/lib/signup-debug";
import { createClient } from "@/lib/supabase";
import type { AuthError } from "@supabase/supabase-js";

const EMAIL_CONFIRMATION_MESSAGE =
  "登録が完了しました。確認メールを開いて認証後、ログインしてください。";

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayError, setDisplayError] = useState<SignupDisplayError | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    console.log("[signup] 入力値チェック開始");

    const validationError = validateSignupInput(username, email, password);
    if (validationError) {
      console.log("[signup] 入力値チェック失敗:", validationError);
      setSuccessMessage(null);
      setDisplayError(
        formatGenericDisplay("入力内容を確認してください。", validationError),
      );
      return;
    }

    console.log("[signup] 入力値チェック成功");

    setLoading(true);
    setDisplayError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    try {
      const supabase = createClient();

      console.log("[signup] supabase.auth.signUp 実行");
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
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

      if (data.session) {
        sessionStorage.setItem(SESSION_PASSWORD_KEY, password);
        console.log("[signup] session あり → dashboard へ遷移");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      console.log("[signup] session なし → メール確認待ち");
      setSuccessMessage(EMAIL_CONFIRMATION_MESSAGE);
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
          disabled={loading}
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
          disabled={loading}
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
          disabled={loading}
        />

        {successMessage ? (
          <p
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}

        {displayError ? <SignupErrorPanel error={displayError} /> : null}

        <NeonButton
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          アカウントを作成
        </NeonButton>
      </form>
    </AuthLayout>
  );
}
