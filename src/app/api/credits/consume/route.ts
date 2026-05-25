import type { ConsumeCreditsBody } from "@/lib/credits/consume";
import { handleConsumeCredits } from "@/lib/credits/consume";
import { corsPreflightResponse, withCors } from "@/lib/api-cors";

export async function OPTIONS(request: Request) {
  const preflight = corsPreflightResponse(request);
  return preflight ?? new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConsumeCreditsBody;
    const response = await handleConsumeCredits(request, body);
    return withCors(request, response);
  } catch {
    const response = Response.json(
      {
        status: "error",
        message: "サーバーエラーが発生しました。",
      },
      { status: 500 },
    );
    return withCors(request, response);
  }
}
