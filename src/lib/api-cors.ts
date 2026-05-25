const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_TOOL_ORIGINS ?? "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsHeaders(request: Request): HeadersInit | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }

  const allowed = getAllowedOrigins();
  if (!allowed.includes(origin)) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    Vary: "Origin",
  };
}

export function withCors(
  request: Request,
  response: Response,
): Response {
  const cors = getCorsHeaders(request);
  if (!cors) {
    return response;
  }

  const headers = new Headers(response.headers);
  Object.entries(cors).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function corsPreflightResponse(request: Request): Response | null {
  const cors = getCorsHeaders(request);
  if (!cors) {
    return null;
  }

  return new Response(null, {
    status: 204,
    headers: cors,
  });
}
