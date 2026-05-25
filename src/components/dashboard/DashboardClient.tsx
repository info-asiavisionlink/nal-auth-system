"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditModal } from "@/components/dashboard/CreditModal";
import { PasswordField } from "@/components/dashboard/PasswordField";
import { NeonButton } from "@/components/ui/NeonButton";
import { SESSION_PASSWORD_KEY } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase";
import type { Profile } from "@/types/database";

type DashboardClientProps = {
  profile: Profile;
};

export function DashboardClient({ profile }: DashboardClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      sessionStorage.removeItem(SESSION_PASSWORD_KEY);
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full max-w-[100vw] overflow-x-hidden cyber-grid">
      <div
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 max-w-[100vw] rounded-full bg-sky-200/50 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 max-w-[100vw] rounded-full bg-amber-100/60 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-3xl box-border px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex min-w-0 flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Dashboard
            </p>
            <h1 className="neon-text mt-2 break-words text-2xl font-bold leading-snug sm:text-3xl">
              ようこそ、{profile.username}
            </h1>
          </div>
          <NeonButton
            type="button"
            variant="ghost"
            onClick={handleLogout}
            loading={loggingOut}
            disabled={loggingOut}
            className="w-full shrink-0 sm:w-auto"
          >
            ログアウト
          </NeonButton>
        </header>

        <section className="glass-panel mb-6 w-full min-w-0 max-w-full rounded-2xl p-5 sm:p-8">
          <h2 className="mb-6 border-b border-sky-100 pb-3 text-lg font-semibold text-slate-800">
            ユーザー情報
          </h2>
          <div className="space-y-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                ユーザー名
              </p>
              <p className="mt-1.5 text-base font-medium text-slate-800">
                {profile.username}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                メールアドレス
              </p>
              <p className="mt-1.5 break-all text-base text-slate-800">{profile.email}</p>
            </div>
            <PasswordField />
          </div>
        </section>

        <section className="glass-panel w-full min-w-0 max-w-full rounded-2xl p-5 sm:p-8">
          <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                現在のクレジット
              </p>
              <p className="mt-2 break-words text-3xl font-bold text-slate-900 sm:text-4xl">
                <span className="neon-text">{profile.credit.toLocaleString()}</span>
                <span className="ml-2 text-lg font-semibold text-amber-600">Credit</span>
              </p>
            </div>
            <NeonButton
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full shrink-0 sm:w-auto"
            >
              クレジット追加
            </NeonButton>
          </div>
        </section>
      </div>

      <CreditModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
