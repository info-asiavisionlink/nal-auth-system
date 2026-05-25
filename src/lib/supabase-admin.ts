import { createClient } from "@supabase/supabase-js";

/** サーバー専用。クライアントからは絶対に import しないこと。 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "管理者用 Supabase 環境変数が未設定です。SUPABASE_SERVICE_ROLE_KEY を確認してください。",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
