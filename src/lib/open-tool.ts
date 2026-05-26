import type { Tool } from "@/types/tool";

/** 将来: access_token / user_id / credit 付与などをここで拡張 */
export type OpenToolOptions = {
  userId?: string;
};

/**
 * ツールを新しいタブで開く。
 * 現段階は tool_url のみ。将来のクエリ付与はこの関数に集約する。
 */
export function openTool(tool: Tool, _options?: OpenToolOptions): void {
  const url = tool.tool_url.trim();
  if (!url) return;

  window.open(url, "_blank", "noopener,noreferrer");
}

export function openManual(tool: Tool): void {
  const url = tool.manual_url.trim();
  if (!url) return;

  window.open(url, "_blank", "noopener,noreferrer");
}
