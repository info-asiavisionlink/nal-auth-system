import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { SystemTool } from "@/types/system-tool";
import type { Tool } from "@/types/database";

export type ToolsFetchResult =
  | { success: true; tools: SystemTool[] }
  | { success: false; error: string };

function mapToolToSystemTool(tool: Tool): SystemTool {
  return {
    tool_id: tool.tool_key,
    tool_name: tool.tool_name,
    description: tool.description ?? "",
    category: tool.category ?? "未分類",
    tags: [],
    image_url: "",
    tool_url: tool.tool_url ?? "",
    document_url: "",
    credit_cost: tool.credit_cost,
    is_active: tool.is_active,
    sort_order: tool.display_order ?? 0,
  };
}

export async function fetchActiveToolsFromDb(): Promise<ToolsFetchResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("tools")
      .select(
        "id, tool_key, tool_name, description, category, tool_url, credit_cost, is_active, display_order, created_at, updated_at",
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return {
        success: false,
        error:
          "ツール一覧の取得に失敗しました。Supabase の tools テーブルと RLS を確認してください。",
      };
    }

    return {
      success: true,
      tools: (data as Tool[]).map(mapToolToSystemTool),
    };
  } catch {
    return {
      success: false,
      error:
        "ツール一覧の取得中にエラーが発生しました。時間をおいて再度お試しください。",
    };
  }
}

export async function fetchToolByKey(toolKey: string): Promise<Tool | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tools")
    .select(
      "id, tool_key, tool_name, description, category, tool_url, credit_cost, is_active, display_order, created_at, updated_at",
    )
    .eq("tool_key", toolKey)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Tool;
}

export function isValidToolCreditCost(creditCost: number): boolean {
  return Number.isInteger(creditCost) && creditCost > 0;
}
