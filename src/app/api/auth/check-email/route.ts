import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          exists: false,
          error: "有効なメールアドレスを入力してください。",
        },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      console.error("CHECK_EMAIL_ERROR", error);
      return NextResponse.json(
        {
          exists: false,
          error: "メールアドレスの確認に失敗しました。時間をおいて再度お試しください。",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ exists: Boolean(data) });
  } catch (error) {
    console.error("CHECK_EMAIL_ERROR", error);
    return NextResponse.json(
      {
        exists: false,
        error: "サーバーエラーが発生しました。時間をおいて再度お試しください。",
      },
      { status: 500 },
    );
  }
}
