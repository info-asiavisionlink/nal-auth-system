import type { Tool } from "@/types/tool";

/** 「使用する」CTA でツールへ渡すユーザー情報（query parameter） */
export type OpenToolUserContext = {
  user_id: string;
  username: string;
  email: string;
  remaining_credit: number;
};

type ProfileLike = {
  id: string;
  username?: string | null;
  email?: string | null;
  credit?: number | null;
};

export function toOpenToolUserContext(profile: ProfileLike): OpenToolUserContext {
  return {
    user_id: profile.id,
    username: profile.username ?? "",
    email: profile.email ?? "",
    remaining_credit: profile.credit ?? 0,
  };
}

function appendUserQueryParams(
  toolUrl: string,
  user: OpenToolUserContext,
): string | null {
  const trimmed = toolUrl.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(
      trimmed,
      typeof window !== "undefined" ? window.location.origin : undefined,
    );
    const params = new URLSearchParams(url.search);

    params.set("user_id", user.user_id);
    params.set("username", user.username);
    params.set("email", user.email);
    params.set("remaining_credit", String(user.remaining_credit));

    url.search = params.toString();
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * ツールを新しいタブで開く。
 * tool_url に user_id / username / email / remaining_credit を付与する。
 */
export function openTool(tool: Tool, user: OpenToolUserContext): void {
  const toolUrl = tool.tool_url.trim();
  if (!toolUrl) return;

  const generatedUrl = appendUserQueryParams(toolUrl, user);
  if (!generatedUrl) return;

  console.info("[openTool]", {
    tool_url: toolUrl,
    generated_url: generatedUrl,
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    remaining_credit: user.remaining_credit,
  });

  window.open(generatedUrl, "_blank", "noopener,noreferrer");
}

export function openManual(tool: Tool): void {
  const url = tool.manual_url.trim();
  if (!url) return;

  window.open(url, "_blank", "noopener,noreferrer");
}
