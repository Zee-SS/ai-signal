import type { PagesFunction } from "../../shared/types/bindings";
import { readLatestSync, readSources } from "../_lib/database";
import { serveCachedJson } from "../_lib/http";

export const onRequestGet: PagesFunction = async ({ request, env, waitUntil }) =>
  serveCachedJson(request, waitUntil, async () => {
    const [sources, latestSync] = await Promise.all([
      readSources(env.AI_SIGNAL_DB),
      readLatestSync(env.AI_SIGNAL_DB),
    ]);
    return {
      meta: { generatedAt: new Date().toISOString() },
      sources,
      latestSync,
    };
  });
