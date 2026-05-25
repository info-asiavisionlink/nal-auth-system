import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-route";

export async function GET(request: NextRequest) {
  console.log("AUTH_CALLBACK_CALLED");

  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const authError = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  console.log("AUTH_CALLBACK_CODE_EXISTS", Boolean(code));
  console.log("AUTH_CALLBACK_TOKEN_HASH_EXISTS", Boolean(tokenHash));

  const successUrl = `${origin}/login?verified=1`;
  const failureUrl = `${origin}/login?error=auth_callback_failed`;

  if (authError) {
    console.error("AUTH_CALLBACK_ERROR", { authError, errorDescription });
    return NextResponse.redirect(failureUrl);
  }

  if (!code && !tokenHash) {
    console.error("AUTH_CALLBACK_ERROR", {
      message: "code も token_hash もありません",
    });
    return NextResponse.redirect(failureUrl);
  }

  const { supabase, redirectSuccess, redirectFailure } = createRouteHandlerClient({
    request,
    successRedirectUrl: successUrl,
    failureRedirectUrl: failureUrl,
  });

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("AUTH_CALLBACK_ERROR", error);
        return redirectFailure();
      }
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      });
      if (error) {
        console.error("AUTH_CALLBACK_ERROR", error);
        return redirectFailure();
      }
    }

    console.log("AUTH_CALLBACK_SUCCESS");

    redirectSuccess();
    await supabase.auth.signOut();

    return redirectSuccess();
  } catch (error) {
    console.error("AUTH_CALLBACK_ERROR", error);
    return redirectFailure();
  }
}
