import { filterModels } from "../../shared/lib/model-filter";
import type { PagesFunction } from "../../shared/types/bindings";
import { readModels } from "../_lib/database";
import { serveCachedJson } from "../_lib/http";

export const onRequestGet: PagesFunction = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  return serveCachedJson(request, waitUntil, async () => {
    const models = filterModels(await readModels(env.AI_SIGNAL_DB, 200), {
      ...(url.searchParams.get("q") ? { query: url.searchParams.get("q") as string } : {}),
      ...(url.searchParams.get("provider") ? { provider: url.searchParams.get("provider") as string } : {}),
      openWeightOnly: url.searchParams.get("open_weight") === "true",
      codingFocusedOnly: url.searchParams.get("coding") === "true",
    });
    return {
      meta: { generatedAt: new Date().toISOString(), count: models.length, pricingUnit: "USD per 1M tokens" },
      models,
    };
  });
};
