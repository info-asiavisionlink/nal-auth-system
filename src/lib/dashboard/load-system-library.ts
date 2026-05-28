import { fetchUserFavoriteToolIds } from "@/lib/favorite-tools";
import { fetchActiveTools } from "@/lib/google-sheets";
import { toOpenToolUserContext } from "@/lib/open-tool";
import type { Profile } from "@/types/database";
import type { Tool } from "@/types/tool";
import type { OpenToolUserContext } from "@/lib/open-tool";

export type SystemLibraryData = {
  tools: Tool[];
  initialFavoriteIds: string[];
  openToolUser: OpenToolUserContext;
  error: string | null;
};

export async function loadSystemLibraryData(
  userId: string,
  profile: Profile,
): Promise<SystemLibraryData> {
  const openToolUser = toOpenToolUserContext(profile);
  const [toolsResult, favoriteIds] = await Promise.all([
    fetchActiveTools(),
    fetchUserFavoriteToolIds(userId),
  ]);

  return {
    tools: toolsResult.success ? toolsResult.tools : [],
    initialFavoriteIds: favoriteIds,
    openToolUser,
    error: toolsResult.success ? null : toolsResult.error,
  };
}
