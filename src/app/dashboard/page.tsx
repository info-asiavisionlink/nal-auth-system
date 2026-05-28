import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { SystemLibraryLoading } from "@/components/dashboard/system-library-loading";
import { SystemLibraryServer } from "@/components/dashboard/system-library-server";
import { isEmailConfirmed } from "@/lib/auth-email";
import { parseLanguage } from "@/lib/i18n/constants";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Profile } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isEmailConfirmed(user)) {
    redirect("/login?error=email_not_confirmed");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, email, credit, created_at, preferred_language")
    .eq("id", user.id)
    .single<Profile>();

  if (error || !profile) {
    redirect("/login");
  }

  const normalizedProfile: Profile = {
    ...profile,
    preferred_language: parseLanguage(profile.preferred_language),
  };

  return (
    <DashboardClient
      profile={normalizedProfile}
      systemLibrary={
        <Suspense fallback={<SystemLibraryLoading />}>
          <SystemLibraryServer userId={user.id} profile={normalizedProfile} />
        </Suspense>
      }
    />
  );
}
