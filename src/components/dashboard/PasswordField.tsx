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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-cyan-400/70">パスワード</p>
        <p className="mt-1 font-mono text-sm text-slate-200">{displayValue}</p>
        {!storedPassword ? (
          <p className="mt-1 text-xs text-slate-500">
            セキュリティのため、再ログイン後のみ一時表示できます。
          </p>
        ) : null}
      </div>
      <NeonButton
        type="button"
        variant="ghost"
        className="shrink-0 text-xs"
        onClick={handleToggle}
        disabled={!storedPassword}
      >
        {revealed ? "隠す" : "確認する"}
      </NeonButton>
    </div>
  );
}
