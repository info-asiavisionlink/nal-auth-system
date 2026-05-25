import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function fetchUserFavoriteToolIds(
  userId: string,
): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("user_favorite_tools")
    .select("tool_id")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.tool_id);
}
