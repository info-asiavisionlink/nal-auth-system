import { NextResponse } from "next/server";
import type { CheckoutApiErrorBody } from "@/lib/checkout-debug";
import {
  CREDIT_PACK_ADD,
  CREDIT_PACK_AMOUNT,
  CREDIT_PACK_CURRENCY,
  CREDIT_PACK_PRODUCT_NAME,
} from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { CheckoutResponseBody, N8nCheckoutPayload } from "@/types/database";

const N8N_PRODUCTION_WEBHOOK_URL =
  "https://nextasia.app.n8n.cloud/webhook/a9145b94-43a1-4b9a-8784-7e1f782523b0";

function getAppOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(request.url);
  return url.origin;
}

function errorResponse(
  status: number,
  cause: string,
  step: string,
  details?: string,
) {
  const body: CheckoutApiErrorBody = {
    error: "決済ページの作成に失敗しました。",
    cause,
    step,
    details,
  };
  console.error("CHECKOUT_ERROR", body);
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  console.log("API_CHECKOUT_CALLED");

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse(
        401,
        "認証が必要です。ログインし直してください。",
        "unauthorized",
      );
    }

    const body = (await request.json()) as {
      termsAccepted?: boolean;
      cancelPolicyAccepted?: boolean;
    };

    if (!body.termsAccepted || !body.cancelPolicyAccepted) {
      return errorResponse(
        400,
        "利用規約とキャンセルポリシーへの同意が必要です。",
        "terms_not_accepted",
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("CHECKOUT_ERROR", {
        step: "profile_fetch_failed",
        profileError,
      });
      return errorResponse(
        500,
        "プロフィール情報の取得に失敗しました。",
        "profile_fetch_failed",
        profileError?.message,
      );
    }

    const origin = getAppOrigin(request);
    const payload: N8nCheckoutPayload = {
      userId: user.id,
      email: profile.email,
      username: profile.username,
      addCredit: CREDIT_PACK_ADD,
      amount: CREDIT_PACK_AMOUNT,
      currency: CREDIT_PACK_CURRENCY,
      productName: CREDIT_PACK_PRODUCT_NAME,
      successUrl: `${origin}/dashboard?payment=success`,
      cancelUrl: `${origin}/dashboard?payment=cancel`,
      timestamp: new Date().toISOString(),
    };

    console.log("FINAL_N8N_URL", N8N_PRODUCTION_WEBHOOK_URL);
    console.log("FINAL_N8N_METHOD", "POST");
    console.log("FINAL_N8N_PAYLOAD", payload);

    let n8nResponse: Response;
    try {
      n8nResponse = await fetch(N8N_PRODUCTION_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "fetch failed";
      console.error("CHECKOUT_ERROR", { step: "n8n_fetch_failed", fetchError });
      return errorResponse(
        502,
        `n8n への接続に失敗しました: ${message}`,
        "n8n_fetch_failed",
        `url: ${N8N_PRODUCTION_WEBHOOK_URL}`,
      );
    }

    const rawText = await n8nResponse.text();

    console.log("FINAL_N8N_STATUS", n8nResponse.status);
    console.log("FINAL_N8N_RAW_TEXT", rawText);

    let data: CheckoutResponseBody = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText) as CheckoutResponseBody;
      } catch {
        console.error("CHECKOUT_ERROR", {
          step: "n8n_invalid_json",
          status: n8nResponse.status,
          rawText,
        });
        return errorResponse(
          502,
          "n8n から JSON 以外のレスポンスが返されました。",
          "n8n_invalid_json",
          `status: ${n8nResponse.status}\nrawText: ${rawText}`,
        );
      }
    }

    if (!n8nResponse.ok) {
      return errorResponse(
        502,
        `n8n が ${n8nResponse.status} を返しました。`,
        "n8n_non_200",
        `status: ${n8nResponse.status}\nrawText: ${rawText}`,
      );
    }

    const checkoutUrl = data.checkoutUrl ?? data.url;

    if (!checkoutUrl || typeof checkoutUrl !== "string") {
      return errorResponse(
        502,
        "checkoutUrl または url が n8n レスポンスに含まれていません。",
        "no_checkout_url",
        rawText ? `rawText: ${rawText}` : `json: ${JSON.stringify(data)}`,
      );
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なサーバーエラー";
    console.error("CHECKOUT_ERROR", error);
    return errorResponse(
      500,
      message,
      "server_exception",
      error instanceof Error ? error.stack : undefined,
    );
  }
}
