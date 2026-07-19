import { type DashboardResponse, dashboardResponseSchema } from "../../shared/schemas/domain";
import type { PagesFunction } from "../../shared/types/bindings";
import { readDashboard } from "../_lib/database";
import { apiError, cacheResponse, jsonResponse, staleCachedResponse } from "../_lib/http";

export const onRequestGet: PagesFunction = async ({ request, env, waitUntil }) => {
  try {
    const environment = env.ENVIRONMENT ?? "production";
    const dashboard = dashboardResponseSchema.parse(await readDashboard(env.AI_SIGNAL_DB, environment));
    const response = jsonResponse(dashboard);
    waitUntil(cacheResponse(request, response));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown D1 failure";
    const cached = await staleCachedResponse(request, message);
    if (cached) {
      try {
        const payload = await cached.clone().json() as DashboardResponse;
        payload.meta = {
          ...payload.meta,
          generatedAt: new Date().toISOString(),
          isStale: true,
          staleReason: "D1 is temporarily unavailable. This response came from the last successful edge cache.",
        };
        const headers = new Headers(cached.headers);
        headers.set("Warning", '110 - "Response is stale"');
        headers.set("X-AI-Signal-Stale", "true");
        return jsonResponse(payload, {
          headers,
        });
      } catch {
        return cached;
      }
    }
    return apiError("Dashboard data is unavailable", 503, "D1 could not be read and no verified cached response exists.");
  }
};
