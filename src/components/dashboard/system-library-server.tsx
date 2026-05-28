import { SystemLibrary } from "@/components/dashboard/system-library";
import { loadSystemLibraryData } from "@/lib/dashboard/load-system-library";
import type { Profile } from "@/types/database";

type SystemLibraryServerProps = {
  userId: string;
  profile: Profile;
};

/**
 * LanguageProvider 配下で描画すること（DashboardClient 内から呼ぶ）。
 */
export async function SystemLibraryServer({
  userId,
  profile,
}: SystemLibraryServerProps) {
  const library = await loadSystemLibraryData(userId, profile);

  return (
    <section className="glass-panel w-full min-w-0 max-w-full p-5 sm:p-8">
      <SystemLibrary
        originalTools={library.tools}
        initialFavoriteIds={library.initialFavoriteIds}
        userId={userId}
        openToolUser={library.openToolUser}
        error={library.error}
      />
    </section>
  );
}
