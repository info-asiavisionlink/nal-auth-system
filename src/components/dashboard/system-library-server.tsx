import { SystemLibrary } from "@/components/dashboard/system-library";
import { fetchUserFavoriteToolIds } from "@/lib/favorite-tools";
import { fetchActiveSystemTools } from "@/lib/google-sheets";

type SystemLibraryServerProps = {
  userId: string;
};

export async function SystemLibraryServer({ userId }: SystemLibraryServerProps) {
  const [toolsResult, favoriteIds] = await Promise.all([
    fetchActiveSystemTools(),
    fetchUserFavoriteToolIds(userId),
  ]);

  return (
    <section className="glass-panel w-full min-w-0 max-w-full p-5 sm:p-8">
      <h2 className="accent-heading mb-6 border-b border-sky-100 pb-3 text-lg font-semibold">
        システム一覧ライブラリ
      </h2>
      <SystemLibrary
        tools={toolsResult.success ? toolsResult.tools : []}
        initialFavoriteIds={favoriteIds}
        userId={userId}
        error={toolsResult.success ? null : toolsResult.error}
      />
    </section>
  );
}
