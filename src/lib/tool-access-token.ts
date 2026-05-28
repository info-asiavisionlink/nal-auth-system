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

export type CreateToolAccessTokenResult =
  | { success: true; token: string; expiresAt: string }
  | { success: false; error: string; code?: string };

export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Google Sheets の tool_url を完全な URL に正規化する */
export function normalizeToolUrl(toolUrl: string): string {
  const trimmed = toolUrl.trim();

  if (!trimmed) {
    throw new Error("ツールURLが空です。");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function appendAccessTokenToUrl(
  toolUrl: string,
  token: string,
  lang?: string,
): string {
  if (!token.trim()) {
    throw new Error("access_token が空です。");
  }

  const normalized = normalizeToolUrl(toolUrl);
  const url = new URL(normalized);
  url.searchParams.set("access_token", token);
  if (lang?.trim()) {
    url.searchParams.set("lang", lang.trim());
  }
  return url.toString();
}

export function urlHasAccessToken(targetUrl: string): boolean {
  try {
    const parsed = new URL(normalizeToolUrl(targetUrl));
    return Boolean(parsed.searchParams.get("access_token")?.trim());
  } catch {
    return targetUrl.includes("access_token=");
  }
}

export async function createToolAccessToken(
  userId: string,
  toolKey: string,
): Promise<CreateToolAccessTokenResult> {
  const admin = createAdminClient();
  const token = generateAccessToken();
  const expiresAt = new Date(
    Date.now() + TOKEN_TTL_MINUTES * 60 * 1000,
  ).toISOString();

  console.log("[tools/open] createToolAccessToken start", {
    userId,
    toolKey,
    expiresAt,
  });

  const { error } = await admin.from("tool_access_tokens").insert({
    user_id: userId,
    tool_key: toolKey,
    token,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("[tools/open] createToolAccessToken failed", {
      userId,
      toolKey,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }

  console.log("[tools/open] createToolAccessToken success", {
    userId,
    toolKey,
    tokenLength: token.length,
  });

  return { success: true, token, expiresAt };
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
