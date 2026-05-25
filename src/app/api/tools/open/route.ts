import { NextResponse } from "next/server";
import { findSystemToolById } from "@/lib/google-sheets";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  appendAccessTokenToUrl,
  createToolAccessToken,
  normalizeToolUrl,
  urlHasAccessToken,
} from "@/lib/tool-access-token";
import {
  fetchToolCreditConfigByKeyAdmin,
  isValidToolCreditCost,
} from "@/lib/tools-db";

type OpenToolBody = {
  tool_key?: string;
  toolId?: string;
};

function tokenInsertErrorMessage(code?: string, message?: string): string {
  if (code === "42P01") {
    return "tool_access_tokens テーブルが存在しません。Supabase SQL Editor で supabase/tool-access-tokens.sql を実行してください。";
  }
  if (code === "23503") {
    return "ユーザー情報が見つかりません。再度ログインしてください。";
  }
  if (message) {
    return `一時トークンの保存に失敗しました: ${message}`;
  }
  return "一時トークンの保存に失敗しました。Supabase の tool_access_tokens テーブルを確認してください。";
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
          message: "ログインが必要です。",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as OpenToolBody;
    const toolKey = (body.tool_key ?? body.toolId)?.trim();

    if (!toolKey) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_REQUEST",
          message: "tool_key が指定されていません。",
        },
        { status: 400 },
      );
    }

    console.log("[tools/open] request", { userId: user.id, toolKey });

    const sheetLookup = await findSystemToolById(toolKey);

    if (sheetLookup.status === "error") {
      return NextResponse.json(
        {
          success: false,
          error: "SHEETS_ERROR",
          message: sheetLookup.error,
          debug: { tool_key: toolKey },
        },
        { status: 503 },
      );
    }

    if (sheetLookup.status === "not_found") {
      return NextResponse.json(
        {
          success: false,
          error: "TOOL_NOT_FOUND",
          message: "対象のツールが見つかりません。",
          debug: { tool_key: toolKey },
        },
        { status: 404 },
      );
    }

    if (sheetLookup.status === "inactive") {
      return NextResponse.json(
        {
          success: false,
          error: "TOOL_INACTIVE",
          message: "このツールは現在利用できません。",
          debug: { tool_key: toolKey },
        },
        { status: 403 },
      );
    }

    const sheetTool = sheetLookup.tool;
    const rawSheetToolUrl = sheetTool.tool_url?.trim() ?? "";

    if (!rawSheetToolUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "TOOL_URL_MISSING",
          message: "ツールURLが設定されていません。",
          debug: {
            tool_key: toolKey,
            sheetToolUrl: rawSheetToolUrl,
            hasAccessToken: false,
          },
        },
        { status: 400 },
      );
    }

    let normalizedSheetToolUrl: string;
    try {
      normalizedSheetToolUrl = normalizeToolUrl(rawSheetToolUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ツールURLの形式が不正です。";
      return NextResponse.json(
        {
          success: false,
          error: "TOOL_URL_INVALID",
          message,
          debug: {
            tool_key: toolKey,
            sheetToolUrl: rawSheetToolUrl,
            hasAccessToken: false,
          },
        },
        { status: 400 },
      );
    }

    const creditConfig = await fetchToolCreditConfigByKeyAdmin(toolKey);

    if (!creditConfig) {
      return NextResponse.json(
        {
          success: false,
          error: "TOOL_CREDIT_NOT_REGISTERED",
          message: "対象のツールがクレジット管理に登録されていません。",
          debug: {
            tool_key: toolKey,
            sheetToolUrl: normalizedSheetToolUrl,
            hasAccessToken: false,
          },
        },
        { status: 404 },
      );
    }

    if (!creditConfig.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "TOOL_INACTIVE",
          message: "このツールは現在利用できません。",
          debug: {
            tool_key: toolKey,
            sheetToolUrl: normalizedSheetToolUrl,
            hasAccessToken: false,
          },
        },
        { status: 403 },
      );
    }

    if (!isValidToolCreditCost(creditConfig.credit_cost)) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_CREDIT_CONFIG",
          message: "ツールのクレジット設定が不正です。",
          debug: {
            tool_key: toolKey,
            sheetToolUrl: normalizedSheetToolUrl,
            hasAccessToken: false,
          },
        },
        { status: 500 },
      );
    }

    const issued = await createToolAccessToken(user.id, toolKey);

    if (!issued.success) {
      return NextResponse.json(
        {
          success: false,
          error: "TOKEN_ISSUE_FAILED",
          message: tokenInsertErrorMessage(issued.code, issued.error),
          debug: {
            tool_key: toolKey,
            sheetToolUrl: normalizedSheetToolUrl,
            hasAccessToken: false,
            tokenErrorCode: issued.code ?? null,
          },
        },
        { status: 500 },
      );
    }

    let redirectUrl: string;
    try {
      redirectUrl = appendAccessTokenToUrl(
        normalizedSheetToolUrl,
        issued.token,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "ツールURLへの access_token 付与に失敗しました。";
      return NextResponse.json(
        {
          success: false,
          error: "TOKEN_APPEND_FAILED",
          message,
          debug: {
            tool_key: toolKey,
            sheetToolUrl: normalizedSheetToolUrl,
            hasAccessToken: false,
          },
        },
        { status: 400 },
      );
    }

    const hasAccessToken = urlHasAccessToken(redirectUrl);

    if (!hasAccessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "TOKEN_APPEND_FAILED",
          message:
            "遷移先URLへの access_token 付与に失敗しました。tool_url を確認してください。",
          debug: {
            tool_key: toolKey,
            sheetToolUrl: normalizedSheetToolUrl,
            hasAccessToken: false,
          },
        },
        { status: 500 },
      );
    }

    console.log("[tools/open] success", {
      toolKey,
      sheetToolUrl: normalizedSheetToolUrl,
      hasAccessToken,
    });

    return NextResponse.json({
      success: true,
      url: redirectUrl,
      tool_key: toolKey,
      credit_cost: creditConfig.credit_cost,
      debug: {
        tool_key: toolKey,
        sheetToolUrl: normalizedSheetToolUrl,
        hasAccessToken,
      },
    });
  } catch (error) {
    console.error("[tools/open] unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "サーバーエラーが発生しました。",
      },
      { status: 500 },
    );
  }
}
