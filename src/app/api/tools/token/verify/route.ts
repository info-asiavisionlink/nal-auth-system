import { NextResponse } from "next/server";
import { corsPreflightResponse, withCors } from "@/lib/api-cors";
import { extractBearerToken } from "@/lib/api-auth";
import { verifyToolAccessToken } from "@/lib/tool-access-token";
import { createAdminClient } from "@/lib/supabase-admin";
import { fetchToolByKeyAdmin } from "@/lib/tools-db";

export async function OPTIONS(request: Request) {
  const preflight = corsPreflightResponse(request);
  return preflight ?? new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  try {
    const token = extractBearerToken(request);

    if (!token) {
      const res = NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
          message: "ログインが必要です。",
        },
        { status: 401 },
      );
      return withCors(request, res);
    }

    const record = await verifyToolAccessToken(token);

    if (!record) {
      const res = NextResponse.json(
        {
          success: false,
          error: "TOKEN_EXPIRED",
          message:
            "認証の有効期限が切れました。ダッシュボードから再度開いてください。",
        },
        { status: 401 },
      );
      return withCors(request, res);
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, username, email, credit")
      .eq("id", record.user_id)
      .single();

    if (profileError || !profile) {
      const res = NextResponse.json(
        {
          success: false,
          error: "PROFILE_NOT_FOUND",
          message: "ユーザー情報の取得に失敗しました。",
        },
        { status: 500 },
      );
      return withCors(request, res);
    }

    const tool = await fetchToolByKeyAdmin(record.tool_key);

    if (!tool || !tool.is_active) {
      const res = NextResponse.json(
        {
          success: false,
          error: "TOOL_INACTIVE",
          message: "このツールは現在利用できません。",
        },
        { status: 403 },
      );
      return withCors(request, res);
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
      },
      tool: {
        tool_key: tool.tool_key,
        tool_name: tool.tool_name,
        credit_cost: tool.credit_cost,
      },
      credit: profile.credit ?? 0,
    });
    return withCors(request, res);
  } catch {
    const res = NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "サーバーエラーが発生しました。",
      },
      { status: 500 },
    );
    return withCors(request, res);
  }
}
