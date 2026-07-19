import type { PagesFunction } from "../../shared/types/bindings";
import { readEvents } from "../_lib/database";
import { serveCachedJson } from "../_lib/http";

export const onRequestGet: PagesFunction = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  return serveCachedJson(request, waitUntil, async () => ({
    meta: { generatedAt: new Date().toISOString(), timezone: "Africa/Johannesburg" },
    events: await readEvents(env.AI_SIGNAL_DB, url.searchParams.get("include_archived") === "true"),
  }));
};
