"use client";

import { useState } from "react";
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
    ? storedPassword ?? "（再ログイン後に表示）"
    : "********";

  function handleToggle() {
    if (!storedPassword) return;
    setPassword(storedPassword);
    setRevealed((prev) => !prev);
  }

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
        パスワード
      </p>
      <p className="mt-2 break-all font-mono text-sm text-slate-800">{displayValue}</p>
      {!storedPassword ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          再ログイン後のみ一時表示できます。
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleToggle}
        disabled={!storedPassword}
        className="mt-3 w-fit rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {revealed ? "隠す" : "確認する"}
      </button>
    </div>
  );
}
