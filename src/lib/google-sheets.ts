/**
 * Google スプレッドシート — ダッシュボードのツール一覧（CMS）。
 * 公開シートは CSV エクスポートで取得（API キー不要）。
 * tool_id は Supabase tools の tool_key と一致させること。
 */
import {
  DEFAULT_GOOGLE_SHEET_ID,
} from "@/lib/constants";
import { fetchSpreadsheetCsvRows } from "@/lib/sheet-csv";
import type { Tool, ToolsFetchResult } from "@/types/tool";

const SHEET_HEADERS = [
  "tool_id",
  "tool_name",
  "description",
  "thumbnail_url",
  "tool_url",
  "manual_url",
  "required_credit",
  "is_active",
  "category",
  "sort_order",
  "button_text",
  "tags",
  "created_at",
] as const;

/** 旧カラム名との互換 */
const HEADER_ALIASES: Record<string, (typeof SHEET_HEADERS)[number]> = {
  image_url: "thumbnail_url",
  document_url: "manual_url",
  credit_cost: "required_credit",
};

function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function parseTags(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function resolveHeader(
  rawHeader: string,
): (typeof SHEET_HEADERS)[number] | null {
  const normalized = normalizeHeader(rawHeader);
  if ((SHEET_HEADERS as readonly string[]).includes(normalized)) {
    return normalized as (typeof SHEET_HEADERS)[number];
  }
  return HEADER_ALIASES[normalized] ?? null;
}

function rowToTool(
  row: string[],
  columnIndex: Partial<Record<(typeof SHEET_HEADERS)[number], number>>,
): Tool | null {
  const get = (key: (typeof SHEET_HEADERS)[number]) => {
    const index = columnIndex[key];
    if (index === undefined) return "";
    return (row[index] ?? "").trim();
  };

  const toolId = get("tool_id");
  const toolName = get("tool_name");

  if (!toolId || !toolName) return null;

  return {
    tool_id: toolId,
    tool_name: toolName,
    description: get("description"),
    thumbnail_url: get("thumbnail_url"),
    tool_url: get("tool_url"),
    manual_url: get("manual_url"),
    required_credit: parseNumber(get("required_credit"), 0),
    is_active: parseBoolean(get("is_active")),
    category: get("category") || "未分類",
    sort_order: parseNumber(get("sort_order"), 0),
    button_text: get("button_text") || "使用する",
    tags: parseTags(get("tags")),
    created_at: get("created_at"),
  };
}

export type SystemToolLookupResult =
  | { status: "found"; tool: Tool }
  | { status: "inactive"; tool: Tool }
  | { status: "not_found" }
  | { status: "error"; error: string };

async function fetchParsedTools(): Promise<ToolsFetchResult> {
  const spreadsheetId =
    process.env.GOOGLE_SHEET_ID?.trim() || DEFAULT_GOOGLE_SHEET_ID;

  const csvResult = await fetchSpreadsheetCsvRows(spreadsheetId);
  if (!csvResult.success) {
    return { success: false, error: csvResult.error };
  }

  const rows = csvResult.rows;
  if (rows.length === 0) {
    return { success: true, tools: [] };
  }

  const headerRow = rows[0];
  const columnIndex: Partial<Record<(typeof SHEET_HEADERS)[number], number>> =
    {};

  headerRow.forEach((cell, index) => {
    const key = resolveHeader(cell);
    if (key !== null && columnIndex[key] === undefined) {
      columnIndex[key] = index;
    }
  });

  const tools = rows
    .slice(1)
    .map((row) => rowToTool(row, columnIndex))
    .filter((tool): tool is Tool => tool !== null);

  return { success: true, tools };
}

export async function fetchActiveTools(): Promise<ToolsFetchResult> {
  const result = await fetchParsedTools();
  if (!result.success) return result;

  return {
    success: true,
    tools: result.tools
      .filter((tool) => tool.is_active)
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

/** @deprecated {@link fetchActiveTools} を使用 */
export async function fetchActiveSystemTools(): Promise<ToolsFetchResult> {
  return fetchActiveTools();
}

export async function findSystemToolById(
  toolId: string,
): Promise<SystemToolLookupResult> {
  const normalizedId = toolId.trim();
  if (!normalizedId) {
    return { status: "not_found" };
  }

  const result = await fetchParsedTools();
  if (!result.success) {
    return { status: "error", error: result.error };
  }

  const tool = result.tools.find((item) => item.tool_id === normalizedId);
  if (!tool) {
    return { status: "not_found" };
  }

  if (!tool.is_active) {
    return { status: "inactive", tool };
  }

  return { status: "found", tool };
}

export function isValidRequiredCredit(requiredCredit: number): boolean {
  return Number.isInteger(requiredCredit) && requiredCredit > 0;
}

/** @deprecated {@link isValidRequiredCredit} を使用 */
export function isValidCreditCost(creditCost: number): boolean {
  return isValidRequiredCredit(creditCost);
}
