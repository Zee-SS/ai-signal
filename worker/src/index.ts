import type { CloudflareEnv } from "../../shared/types/bindings";
import { runIngestion } from "./ingestion/run";
import { scheduled } from "./scheduled";

const attempts = new Map<string, number[]>();
const RATE_WINDOW_MS = 15 * 60 * 1_000;
const RATE_LIMIT = 3;

function rateLimited(key: string, now = Date.now()): boolean {
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    attempts.set(key, recent);
    return true;
  }
  recent.push(now);
  attempts.set(key, recent);
  return false;
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

async function handleFetch(request: Request, env: CloudflareEnv): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") {
    return Response.json({ service: "ai-signal-ingestion", status: "ok" }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method !== "POST" || url.pathname !== "/ingest") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!env.SYNC_SECRET || env.SYNC_SECRET.length < 32) {
    return Response.json({ error: "Manual ingestion is not configured" }, { status: 503 });
  }
  const clientKey = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (rateLimited(clientKey)) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": "900" } });
  }
  const authorization = request.headers.get("Authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!constantTimeEqual(supplied, env.SYNC_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runIngestion(env);
  return Response.json(summary, { status: summary.status === "failed" ? 502 : 200, headers: { "Cache-Control": "no-store" } });
}

export default {
  fetch: handleFetch,
  scheduled,
} satisfies ExportedHandler<CloudflareEnv>;
