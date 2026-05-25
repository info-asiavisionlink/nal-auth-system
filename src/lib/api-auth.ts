import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  verifyToolAccessToken,
  type ToolAccessTokenRecord,
} from "@/lib/tool-access-token";

export type SessionAuth = {
  type: "session";
  userId: string;
};

export type BearerAuth = {
  type: "bearer";
  userId: string;
  toolKey: string;
  tokenRecord: ToolAccessTokenRecord;
};

export type ResolvedAuth = SessionAuth | BearerAuth;

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice(7).trim();
  return token || null;
}

export async function resolveApiAuth(
  request: Request,
): Promise<ResolvedAuth | null> {
  const bearerToken = extractBearerToken(request);
  if (bearerToken) {
    const record = await verifyToolAccessToken(bearerToken);
    if (!record) {
      return null;
    }
    return {
      type: "bearer",
      userId: record.user_id,
      toolKey: record.tool_key,
      tokenRecord: record,
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { type: "session", userId: user.id };
}
