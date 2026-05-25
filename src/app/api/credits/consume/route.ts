import type { ConsumeCreditsBody } from "@/lib/credits/consume";
import { handleConsumeCredits } from "@/lib/credits/consume";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConsumeCreditsBody;
    return handleConsumeCredits(body);
  } catch {
    return Response.json(
      {
        status: "error",
        message: "サーバーエラーが発生しました。",
      },
      { status: 500 },
    );
  }
}
