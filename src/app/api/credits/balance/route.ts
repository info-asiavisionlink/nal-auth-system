import { corsPreflightResponse, withCors } from "@/lib/api-cors";
import { handleCreditsBalance } from "@/lib/credits/balance";

export async function OPTIONS(request: Request) {
  const preflight = corsPreflightResponse(request);
  return preflight ?? new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  try {
    const response = await handleCreditsBalance(request);
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
