import { SystemLibrary } from "@/components/dashboard/system-library";
import { fetchUserFavoriteToolIds } from "@/lib/favorite-tools";
import { fetchActiveTools } from "@/lib/google-sheets";
import { toOpenToolUserContext } from "@/lib/open-tool";
import type { Profile } from "@/types/database";

type SystemLibraryServerProps = {
  userId: string;
  profile: Profile;
};

export async function SystemLibraryServer({
  userId,
  profile,
}: SystemLibraryServerProps) {
  const openToolUser = toOpenToolUserContext(profile);
  const [toolsResult, favoriteIds] = await Promise.all([
    fetchActiveTools(),
    fetchUserFavoriteToolIds(userId),
  ]);

  return (
    <section className="glass-panel w-full min-w-0 max-w-full p-5 sm:p-8">
      <SystemLibrary
        tools={toolsResult.success ? toolsResult.tools : []}
        initialFavoriteIds={favoriteIds}
        userId={userId}
        openToolUser={openToolUser}
        error={toolsResult.success ? null : toolsResult.error}
      />
    </section>
  );
}
