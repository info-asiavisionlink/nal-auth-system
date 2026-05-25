/**
 * Supabase tools テーブル — クレジット消費 API 専用。
 * ダッシュボード表示は Google Sheets（google-sheets.ts）を使用する。
 */
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Tool } from "@/types/database";

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
