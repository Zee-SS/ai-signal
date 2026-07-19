export const API_CACHE = {
  maxAgeSeconds: 180,
  staleWhileRevalidateSeconds: 10_800,
} as const;

export const API_CACHE_CONTROL = [
  "public",
  `max-age=${API_CACHE.maxAgeSeconds}`,
  `s-maxage=${API_CACHE.maxAgeSeconds}`,
  `stale-while-revalidate=${API_CACHE.staleWhileRevalidateSeconds}`,
  "stale-if-error=86400",
].join(", ");

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", API_CACHE_CONTROL);
  headers.set("Vary", "Accept-Encoding");
  headers.set("X-Content-Type-Options", "nosniff");
  return Response.json(body, { ...init, headers });
}

export function apiError(message: string, status = 500, detail?: string): Response {
  return jsonResponse({
    error: {
      message,
      detail: detail ?? null,
      generatedAt: new Date().toISOString(),
    },
  }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function cacheResponse(request: Request, response: Response): Promise<void> {
  if (request.method !== "GET") return;
  try {
    const edgeCache = (caches as unknown as { default: Cache }).default;
    await edgeCache.put(new Request(request.url, { method: "GET" }), response.clone());
  } catch {
    // The local Pages runtime may not expose the default cache. D1 remains the source of truth.
  }
}

export async function staleCachedResponse(request: Request, reason: string): Promise<Response | null> {
  try {
    const edgeCache = (caches as unknown as { default: Cache }).default;
    const cached = await edgeCache.match(new Request(request.url, { method: "GET" }));
    if (!cached) return null;
    const headers = new Headers(cached.headers);
    headers.set("Warning", '110 - "Response is stale"');
    headers.set("X-AI-Signal-Stale", "true");
    headers.set("X-AI-Signal-Stale-Reason", reason.slice(0, 180));
    return new Response(cached.body, { status: 200, headers });
  } catch {
    return null;
  }
}

export async function serveCachedJson(
  request: Request,
  waitUntil: (promise: Promise<unknown>) => void,
  loader: () => Promise<unknown>,
): Promise<Response> {
  try {
    const response = jsonResponse(await loader());
    waitUntil(cacheResponse(request, response));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown data-store failure";
    const cached = await staleCachedResponse(request, message);
    return cached ?? apiError("Verified data is temporarily unavailable", 503, message);
  }
}
