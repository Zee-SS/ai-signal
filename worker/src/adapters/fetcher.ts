export interface FetchPolicy {
  timeoutMs?: number;
  retries?: number;
  retryBaseMs?: number;
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const wait = (durationMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

export async function fetchWithPolicy(
  input: RequestInfo | URL,
  init: RequestInit = {},
  policy: FetchPolicy = {},
): Promise<Response> {
  const timeoutMs = policy.timeoutMs ?? 10_000;
  const retries = policy.retries ?? 2;
  const retryBaseMs = policy.retryBaseMs ?? 250;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("Source request timed out"), timeoutMs);
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: "application/json, application/atom+xml, application/rss+xml, application/xml, text/xml, text/html;q=0.7",
          "User-Agent": "AI-Signal/1.0 (+https://github.com/)",
          ...init.headers,
        },
      });
      clearTimeout(timeout);

      if (response.ok) return response;
      if (!RETRYABLE_STATUS.has(response.status) || attempt === retries) {
        lastError = new Error(`Source returned HTTP ${response.status}`);
        break;
      }

      const retryAfter = Number(response.headers.get("Retry-After"));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1_000, 10_000)
        : retryBaseMs * 3 ** attempt;
      await wait(backoff);
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt === retries) break;
      await wait(retryBaseMs * 3 ** attempt);
    }
  }

  const message = lastError instanceof Error ? lastError.message : "Unknown source request failure";
  throw new Error(message);
}
