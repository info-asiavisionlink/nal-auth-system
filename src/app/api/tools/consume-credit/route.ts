import type { ConsumeCreditsBody } from "@/lib/credits/consume";
import { handleConsumeCredits } from "@/lib/credits/consume";

/**
 * 互換ルート。正規は POST /api/credits/consume
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConsumeCreditsBody;
    const response = await handleConsumeCredits(request, body);
    const payload = await response.json();

    if (payload.status === "success") {
      return Response.json({
        success: true,
        toolId: payload.tool_key,
        creditCost: payload.credit_cost,
        creditBefore: payload.credit_before,
        creditAfter: payload.credit_after,
      });
    }

    if (payload.status === "insufficient_credit") {
      return Response.json(
        {
          success: false,
          error: "INSUFFICIENT_CREDIT",
          message: payload.message,
          requiredCredit: payload.required_credit,
          currentCredit: payload.current_credit,
        },
        { status: 402 },
      );
    }

    if (payload.status === "unauthorized") {
      return Response.json(
        {
          success: false,
          error: "UNAUTHORIZED",
          message: payload.message,
        },
        { status: 401 },
      );
    }

    if (payload.error === "TOOL_TOKEN_MISMATCH") {
      return Response.json(
        {
          success: false,
          error: "TOOL_TOKEN_MISMATCH",
          message: payload.message,
        },
        { status: 403 },
      );
    }

    return Response.json(
      {
        success: false,
        error: "CONSUME_FAILED",
        message: payload.message ?? "クレジット消費に失敗しました。",
      },
      { status: response.status },
    );
  } catch {
    return Response.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "サーバーエラーが発生しました。",
      },
      { status: 500 },
    );
  }
}
