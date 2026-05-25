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
    <div className="relative min-h-screen overflow-hidden cyber-grid">
      <div
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80">
              Dashboard
            </p>
            <h1 className="neon-text mt-1 text-2xl font-bold sm:text-3xl">
              ようこそ、{profile.username}
            </h1>
          </div>
          <NeonButton
            type="button"
            variant="ghost"
            onClick={handleLogout}
            loading={loggingOut}
            disabled={loggingOut}
            className="self-start sm:self-auto"
          >
            ログアウト
          </NeonButton>
        </header>

        <section className="glass-panel mb-6 rounded-2xl p-6 sm:p-8">
          <h2 className="mb-6 text-lg font-semibold text-cyan-100">ユーザー情報</h2>
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-400/70">
                ユーザー名
              </p>
              <p className="mt-1 text-base text-white">{profile.username}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-400/70">
                メールアドレス
              </p>
              <p className="mt-1 break-all text-base text-white">{profile.email}</p>
            </div>
            <PasswordField />
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-400/70">
                現在のクレジット
              </p>
              <p className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                {profile.credit.toLocaleString()}{" "}
                <span className="text-lg font-medium text-cyan-300">Credit</span>
              </p>
            </div>
            <NeonButton type="button" onClick={() => setModalOpen(true)}>
              クレジット追加
            </NeonButton>
          </div>
        </section>
      </div>

      <CreditModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
