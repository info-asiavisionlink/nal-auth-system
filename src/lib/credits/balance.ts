import { NextResponse } from "next/server";
import { resolveApiAuth } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function handleCreditsBalance(
  request: Request,
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

  if (auth.type === "bearer") {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("credit")
      .eq("id", auth.userId)
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
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("credit")
    .eq("id", auth.userId)
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
}
