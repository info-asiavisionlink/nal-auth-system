import { NextResponse } from "next/server";
import { findSystemToolById } from "@/lib/google-sheets";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  appendAccessTokenToUrl,
  createToolAccessToken,
} from "@/lib/tool-access-token";
import { fetchToolByKeyAdmin } from "@/lib/tools-db";

type OpenToolBody = {
  tool_key?: string;
  toolId?: string;
};

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

    const sheetLookup = await findSystemToolById(toolKey);

    if (sheetLookup.status === "error") {
      return NextResponse.json(
        {
          success: false,
          error: "SHEETS_ERROR",
          message: sheetLookup.error,
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
        },
        { status: 403 },
      );
    }

    const sheetTool = sheetLookup.tool;

    if (!sheetTool.tool_url?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "TOOL_URL_MISSING",
          message: "ツールURLが設定されていません。",
        },
        { status: 400 },
      );
    }

    const dbTool = await fetchToolByKeyAdmin(toolKey);

    if (!dbTool) {
      return NextResponse.json(
        {
          success: false,
          error: "TOOL_NOT_FOUND",
          message: "対象のツールが見つかりません。",
        },
        { status: 404 },
      );
    }

    if (!dbTool.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "TOOL_INACTIVE",
          message: "このツールは現在利用できません。",
        },
        { status: 403 },
      );
    }

    const issued = await createToolAccessToken(user.id, toolKey);

    if (!issued) {
      return NextResponse.json(
        {
          success: false,
          error: "TOKEN_ISSUE_FAILED",
          message: "一時トークンの発行に失敗しました。",
        },
        { status: 500 },
      );
    }

    let redirectUrl: string;
    try {
      redirectUrl = appendAccessTokenToUrl(
        sheetTool.tool_url.trim(),
        issued.token,
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "TOOL_URL_INVALID",
          message: "ツールURLの形式が不正です。",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      url: redirectUrl,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "サーバーエラーが発生しました。",
      },
      { status: 500 },
    );
  }
}
