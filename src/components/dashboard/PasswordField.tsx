"use client";

import { useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { SESSION_PASSWORD_KEY } from "@/lib/auth-errors";

function readSessionPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_PASSWORD_KEY);
}

export function PasswordField() {
  const [revealed, setRevealed] = useState(false);
  const [password, setPassword] = useState<string | null>(null);

  const storedPassword = password ?? readSessionPassword();

  const displayValue = revealed
    ? storedPassword ?? "（この端末のログインセッションでは表示できません）"
    : "********";

  function handleToggle() {
    if (!storedPassword) return;
    setPassword(storedPassword);
    setRevealed((prev) => !prev);
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
          パスワード
        </p>
        <p className="mt-1.5 break-all font-mono text-sm text-slate-700">{displayValue}</p>
        {!storedPassword ? (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            セキュリティのため、再ログイン後のみ一時表示できます。
          </p>
        ) : null}
      </div>
      <NeonButton
        type="button"
        variant="ghost"
        className="w-full shrink-0 text-xs sm:w-auto"
        onClick={handleToggle}
        disabled={!storedPassword}
      >
        {revealed ? "隠す" : "確認する"}
      </NeonButton>
    </div>
  );
}
