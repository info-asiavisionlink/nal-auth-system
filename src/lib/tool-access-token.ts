import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase-admin";

const TOKEN_TTL_MINUTES = 30;

export type ToolAccessTokenRecord = {
  id: string;
  user_id: string;
  tool_key: string;
  token: string;
  expires_at: string;
};

export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function appendAccessTokenToUrl(toolUrl: string, token: string): string {
  const url = new URL(toolUrl);
  url.searchParams.set("access_token", token);
  return url.toString();
}

export async function createToolAccessToken(
  userId: string,
  toolKey: string,
): Promise<{ token: string; expiresAt: string } | null> {
  const admin = createAdminClient();
  const token = generateAccessToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await admin.from("tool_access_tokens").insert({
    user_id: userId,
    tool_key: toolKey,
    token,
    expires_at: expiresAt,
  });

  if (error) {
    return null;
  }

  return { token, expiresAt };
}

export async function verifyToolAccessToken(
  token: string,
): Promise<ToolAccessTokenRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tool_access_tokens")
    .select("id, user_id, tool_key, token, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return data as ToolAccessTokenRecord;
}
