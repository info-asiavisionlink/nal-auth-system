import { NextResponse } from "next/server";
import { parseLanguage } from "@/lib/i18n/constants";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/types";
import { translateTexts } from "@/lib/translation/translate-texts";

type TranslateRequestBody = {
  texts?: string[];
  targetLanguage?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslateRequestBody;
    const texts = Array.isArray(body.texts)
      ? body.texts.map((item) => (typeof item === "string" ? item : ""))
      : [];
    const targetLanguage = parseLanguage(body.targetLanguage);

    if (
      body.targetLanguage &&
      !(SUPPORTED_LANGUAGES as readonly string[]).includes(body.targetLanguage)
    ) {
      return NextResponse.json(
        { error: "Unsupported target language" },
        { status: 400 },
      );
    }

    const translations = await translateTexts(texts, targetLanguage);

    return NextResponse.json({ translations });
  } catch (error) {
    console.error("[api/translate] unexpected error", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 },
    );
  }
}
