import { NextResponse } from "next/server";
import type { ResolvedAuth } from "@/lib/api-auth";
import { resolveApiAuth } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  fetchToolByKeyAdmin,
  isValidToolCreditCost,
} from "@/lib/tools-db";

export type ConsumeCreditsBody = {
  tool_key?: string;
  toolId?: string;
  external_request_id?: string | null;
  credit_cost?: unknown;
};

type RpcConsumeResult = {
  success: boolean;
  credit_before: number | null;
  credit_after: number | null;
  error: string | null;
};

async function logToolInactiveAdmin(
  userId: string,
  toolKey: string,
  toolName: string,
  creditCost: number,
  externalRequestId: string | null,
) {
  const admin = createAdminClient();
  await admin.from("tool_usage_logs").insert({
    user_id: userId,
    tool_key: toolKey,
    tool_name: toolName,
    credit_cost: creditCost,
    credit_before: null,
    credit_after: null,
    status: "tool_inactive",
    message: "このツールは現在利用できません。",
    external_request_id: externalRequestId,
  });
}

async function runConsumeRpc(
  auth: ResolvedAuth,
  userId: string,
  toolKey: string,
  toolName: string,
  creditCost: number,
  externalRequestId: string | null,
): Promise<{ result: RpcConsumeResult | null; rpcError: boolean }> {
  const params = {
    p_user_id: userId,
    p_tool_key: toolKey,
    p_tool_name: toolName,
    p_credit_cost: creditCost,
    p_external_request_id: externalRequestId,
  };

  if (auth.type === "bearer") {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_credit_for_user", params);
    if (error) {
      return { result: null, rpcError: true };
    }
    const result = (Array.isArray(data) ? data[0] : data) as RpcConsumeResult;
    return { result, rpcError: false };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("consume_credit_by_tool_key", params);
  if (error) {
    return { result: null, rpcError: true };
  }
  const result = (Array.isArray(data) ? data[0] : data) as RpcConsumeResult;
  return { result, rpcError: false };
}

export async function handleConsumeCredits(
  request: Request,
  body: ConsumeCreditsBody,
): Promise<NextResponse> {
  const auth = await resolveApiAuth(request);

  if (!auth) {
    return NextResponse.json(
      {
        status: "unauthorized",
        message: "ログインが必要です。",
      },
      { status: 401 },
    );
  }

  const toolKey = (body.tool_key ?? body.toolId)?.trim();
  const externalRequestId = body.external_request_id?.trim() || null;

  if (!toolKey) {
    return NextResponse.json(
      {
        status: "error",
        message: "tool_key が指定されていません。",
      },
      { status: 400 },
    );
  }

  if (auth.type === "bearer" && auth.toolKey !== toolKey) {
    return NextResponse.json(
      {
        status: "error",
        error: "TOOL_TOKEN_MISMATCH",
        message: "このトークンでは対象ツールを利用できません。",
      },
      { status: 403 },
    );
  }

  const tool = await fetchToolByKeyAdmin(toolKey);

  if (!tool) {
    return NextResponse.json(
      {
        status: "error",
        message: "対象のツールが見つかりません。",
      },
      { status: 404 },
    );
  }

  if (!tool.is_active) {
    await logToolInactiveAdmin(
      auth.userId,
      tool.tool_key,
      tool.tool_name,
      tool.credit_cost,
      externalRequestId,
    );
    return NextResponse.json(
      {
        status: "error",
        message: "このツールは現在利用できません。",
      },
      { status: 403 },
    );
  }

  const creditCost = tool.credit_cost;

  if (!isValidToolCreditCost(creditCost)) {
    return NextResponse.json(
      {
        status: "error",
        message: "ツールのクレジット設定が不正です。",
      },
      { status: 500 },
    );
  }

  const { result, rpcError } = await runConsumeRpc(
    auth,
    auth.userId,
    tool.tool_key,
    tool.tool_name,
    creditCost,
    externalRequestId,
  );

  if (rpcError || !result) {
    return NextResponse.json(
      {
        status: "error",
        message: "クレジット消費に失敗しました。時間をおいて再度お試しください。",
      },
      { status: 500 },
    );
  }

  if (result.error === "UNAUTHORIZED") {
    return NextResponse.json(
      {
        status: "unauthorized",
        message: "ログインが必要です。",
      },
      { status: 401 },
    );
  }

  if (result.error === "DUPLICATE_REQUEST") {
    return NextResponse.json(
      {
        status: "error",
        message: "このリクエストは既に処理済みです。",
      },
      { status: 409 },
    );
  }

  if (result.error === "INSUFFICIENT_CREDIT") {
    const currentCredit = result.credit_before ?? 0;
    return NextResponse.json(
      {
        status: "insufficient_credit",
        message: "クレジットが不足しています。",
        required_credit: creditCost,
        current_credit: currentCredit,
      },
      { status: 402 },
    );
  }

  if (!result.success || result.error) {
    return NextResponse.json(
      {
        status: "error",
        message: "クレジット消費に失敗しました。",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    status: "success",
    tool_key: tool.tool_key,
    credit_cost: creditCost,
    credit_before: result.credit_before,
    credit_after: result.credit_after,
  });
}
