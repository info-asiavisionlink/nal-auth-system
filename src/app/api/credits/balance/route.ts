import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  try {
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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("credit")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        {
          status: "error",
          message: "クレジット残高の取得に失敗しました。",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
      credit: profile.credit ?? 0,
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "サーバーエラーが発生しました。",
      },
      { status: 500 },
    );
  }
}
