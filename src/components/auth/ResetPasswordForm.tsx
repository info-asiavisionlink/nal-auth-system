"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInputField } from "@/components/ui/PasswordInputField";
import { NeonButton } from "@/components/ui/NeonButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createClient } from "@/lib/supabase";

const MIN_PASSWORD_LENGTH = 6;

function validatePasswords(
  password: string,
  confirmPassword: string,
): string | null {
  if (!password || !confirmPassword) {
    return "新しいパスワードと確認用パスワードを入力してください。";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return "パスワードは6文字以上で入力してください。";
  }
  if (password !== confirmPassword) {
    return "パスワードが一致しません。";
  }
  return null;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabaseClient = createClient();

    async function initSession() {
      const code = searchParams.get("code");
      const authError = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (authError) {
        if (!cancelled) {
          setError(
            errorDescription ??
              "パスワード再設定リンクが無効です。再度お試しください。",
          );
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
  }, [searchParams]);

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
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="新しいパスワード"
      subtitle="新しいパスワードを入力して保存してください"
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
            {error ??
              "パスワード再設定リンクが無効または期限切れです。再度メール送信からお試しください。"}
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            再設定メールを送信する
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <PasswordInputField
            label="新しいパスワード"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            disabled={loading}
          />
          <PasswordInputField
            label="パスワード（確認）"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="もう一度入力"
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
            保存
          </NeonButton>
        </form>
      )}
    </AuthLayout>
  );
}
