/**
 * Supabase tools テーブル — クレジット消費 API 専用。
 * ダッシュボード表示・遷移先 URL は Google Sheets（google-sheets.ts）を使用する。
 * tools.tool_url は参照しない。
 */
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Tool } from "@/types/database";

/** Supabase tools — クレジット・有効/無効のみ（URL は Google Sheets を使用） */
export type ToolCreditConfig = {
  tool_key: string;
  tool_name: string;
  credit_cost: number;
  is_active: boolean;
};

export async function fetchToolCreditConfigByKeyAdmin(
  toolKey: string,
): Promise<ToolCreditConfig | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tools")
    .select("tool_key, tool_name, credit_cost, is_active")
    .eq("tool_key", toolKey)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ToolCreditConfig;
}

export async function fetchToolByKeyAdmin(toolKey: string): Promise<Tool | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
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
