import type { SystemTool, SystemToolsFetchResult } from "@/types/system-tool";

const SHEET_HEADERS = [
  "tool_id",
  "tool_name",
  "description",
  "category",
  "tags",
  "image_url",
  "tool_url",
  "document_url",
  "credit_cost",
  "is_active",
  "sort_order",
] as const;

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

function rowToTool(
  row: string[],
  columnIndex: Record<string, number>,
): SystemTool | null {
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
    category: get("category") || "未分類",
    tags: parseTags(get("tags")),
    image_url: get("image_url"),
    tool_url: get("tool_url"),
    document_url: get("document_url"),
    credit_cost: parseNumber(get("credit_cost"), 0),
    is_active: parseBoolean(get("is_active")),
    sort_order: parseNumber(get("sort_order"), 0),
  };
}

async function getFirstSheetTitle(
  spreadsheetId: string,
  apiKey: string,
): Promise<string | null> {
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
  );
  url.searchParams.set("fields", "sheets.properties.title");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    next: { revalidate: 300 },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    sheets?: { properties?: { title?: string } }[];
  };

  return data.sheets?.[0]?.properties?.title ?? null;
}

export async function fetchActiveSystemTools(): Promise<SystemToolsFetchResult> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!apiKey || !spreadsheetId) {
    return {
      success: false,
      error:
        "Google Sheets の環境変数が未設定です。GOOGLE_SHEETS_API_KEY と GOOGLE_SHEET_ID を確認してください。",
    };
  }

  try {
    const sheetTitle =
      process.env.GOOGLE_SHEET_RANGE?.split("!")[0] ??
      (await getFirstSheetTitle(spreadsheetId, apiKey)) ??
      "Sheet1";

    const range = process.env.GOOGLE_SHEET_RANGE ?? `${sheetTitle}!A:K`;
    const valuesUrl = new URL(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    );
    valuesUrl.searchParams.set("key", apiKey);

    const response = await fetch(valuesUrl.toString(), {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        success: false,
        error: `Google Sheets からデータを取得できませんでした。（${response.status}）${body ? ` ${body.slice(0, 120)}` : ""}`,
      };
    }

    const payload = (await response.json()) as { values?: string[][] };
    const rows = payload.values ?? [];

    if (rows.length < 2) {
      return { success: true, tools: [] };
    }

    const headerRow = rows[0].map(normalizeHeader);
    const columnIndex: Record<string, number> = {};

    SHEET_HEADERS.forEach((header) => {
      const index = headerRow.indexOf(header);
      if (index >= 0) columnIndex[header] = index;
    });

    const tools = rows
      .slice(1)
      .map((row) => rowToTool(row, columnIndex))
      .filter((tool): tool is SystemTool => tool !== null)
      .filter((tool) => tool.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

    return { success: true, tools };
  } catch {
    return {
      success: false,
      error:
        "システム一覧の取得中にエラーが発生しました。時間をおいて再度お試しください。",
    };
  }
}
