import { NextResponse } from "next/server";
import {
  fetchToolByKey,
  isValidToolCreditCost,
} from "@/lib/tools-db";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

async function logToolInactive(
  userId: string,
  toolKey: string,
  toolName: string,
  creditCost: number,
  externalRequestId: string | null,
) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("tool_usage_logs").insert({
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

export async function handleConsumeCredits(
  body: ConsumeCreditsBody,
): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const tool = await fetchToolByKey(toolKey);

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
    await logToolInactive(
      user.id,
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

  const { data, error: rpcError } = await supabase.rpc(
    "consume_credit_by_tool_key",
    {
      p_user_id: user.id,
      p_tool_key: tool.tool_key,
      p_tool_name: tool.tool_name,
      p_credit_cost: creditCost,
      p_external_request_id: externalRequestId,
    },
  );

  if (rpcError) {
    return NextResponse.json(
      {
        status: "error",
        message: "クレジット消費に失敗しました。時間をおいて再度お試しください。",
      },
      { status: 500 },
    );
  }

  const result = (Array.isArray(data) ? data[0] : data) as
    | RpcConsumeResult
    | undefined;

  if (!result) {
    return NextResponse.json(
      {
        status: "error",
        message: "クレジット消費に失敗しました。",
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
