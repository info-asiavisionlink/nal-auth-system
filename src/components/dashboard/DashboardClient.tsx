"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { FakeUsageStats } from "@/components/common/FakeUsageStats";
import { CreditModal } from "@/components/dashboard/CreditModal";
import { DashboardLanguageSwitcher } from "@/components/dashboard/DashboardLanguageSwitcher";
import { PasswordField } from "@/components/dashboard/PasswordField";
import { NeonButton } from "@/components/ui/NeonButton";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { SESSION_PASSWORD_KEY } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase";
import type { Profile } from "@/types/database";

type DashboardClientProps = {
  profile: Profile;
  systemLibrary?: ReactNode;
};

function UserInfoCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium leading-relaxed text-slate-800 sm:text-base">
        {value}
      </p>
    </div>
  );
}

function DashboardClientContent({
  profile,
  systemLibrary,
}: DashboardClientProps) {
  const router = useRouter();
  const { translate } = useLanguage();
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
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 max-w-[100vw] rounded-full bg-sky-100/80 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 max-w-[100vw] rounded-full bg-amber-50/90 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-7xl box-border px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex min-w-0 flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 text-center sm:text-left">
            <p className="accent-heading text-xs font-semibold uppercase tracking-[0.2em]">
              {translate("dashboardLabel")}
            </p>
            <h1 className="accent-heading mt-2 break-words text-2xl font-bold leading-snug sm:text-3xl">
              {translate("dashboardWelcome", { username: profile.username })}
            </h1>
          </div>
          <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:w-auto sm:items-end">
            <FakeUsageStats className="w-full sm:w-auto" />
            <DashboardLanguageSwitcher />
            <NeonButton
              type="button"
              variant="ghost"
              onClick={handleLogout}
              loading={loggingOut}
              disabled={loggingOut}
              className="w-full shrink-0 sm:w-auto"
            >
              {translate("logout")}
            </NeonButton>
          </div>
        </header>

        <section className="glass-panel mb-6 w-full min-w-0 max-w-full p-5 sm:p-8">
          <h2 className="accent-heading mb-5 border-b border-sky-100 pb-3 text-lg font-semibold">
            {translate("userInfo")}
          </h2>
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch">
            <UserInfoCell label={translate("username")} value={profile.username} />
            <UserInfoCell label={translate("email")} value={profile.email} />
            <PasswordField />
          </div>
        </section>

        <section className="glass-panel mb-6 w-full min-w-0 max-w-full p-5 sm:p-8">
          <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                {translate("currentCredit")}
              </p>
              <p className="mt-2 break-words text-3xl font-bold sm:text-4xl">
                <span className="accent-heading">{profile.credit.toLocaleString()}</span>
                <span className="ml-2 text-lg font-semibold text-amber-500">
                  {translate("creditUnit")}
                </span>
              </p>
            </div>
            <NeonButton
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full shrink-0 sm:w-auto"
            >
              {translate("addCredit")}
            </NeonButton>
          </div>
        </section>

        {systemLibrary}
      </div>

      <CreditModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export function DashboardClient({ profile, systemLibrary }: DashboardClientProps) {
  return (
    <LanguageProvider
      initialLanguage={profile.preferred_language}
      userId={profile.id}
    >
      <DashboardClientContent profile={profile} systemLibrary={systemLibrary} />
    </LanguageProvider>
  );
}
