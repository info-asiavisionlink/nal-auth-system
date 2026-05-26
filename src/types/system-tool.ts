export type { Tool, ToolsFetchResult } from "@/types/tool";

/** @deprecated 新規コードは {@link Tool} を使用してください */
export type SystemTool = import("@/types/tool").Tool;

/** @deprecated 新規コードは {@link ToolsFetchResult} を使用してください */
export type SystemToolsFetchResult = import("@/types/tool").ToolsFetchResult;
