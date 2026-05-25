import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type RouteHandlerClientOptions = {
  request: NextRequest;
  successRedirectUrl: string;
  failureRedirectUrl: string;
};

export function createRouteHandlerClient({
  request,
  successRedirectUrl,
  failureRedirectUrl,
}: RouteHandlerClientOptions) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase の環境変数が未設定です。NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を確認してください。",
    );
  }

  let redirectUrl = failureRedirectUrl;
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.redirect(redirectUrl);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    redirectSuccess() {
      redirectUrl = successRedirectUrl;
      response = NextResponse.redirect(successRedirectUrl);
      return response;
    },
    redirectFailure() {
      redirectUrl = failureRedirectUrl;
      response = NextResponse.redirect(failureRedirectUrl);
      return response;
    },
    getResponse() {
      return response;
    },
  };
}
