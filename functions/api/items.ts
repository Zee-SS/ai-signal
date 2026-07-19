import { itemTypeSchema } from "../../shared/schemas/domain";
import type { PagesFunction } from "../../shared/types/bindings";
import { readItems, readSources } from "../_lib/database";
import { serveCachedJson } from "../_lib/http";

export const onRequestGet: PagesFunction = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  const requestedType = url.searchParams.get("type");
  const parsedType = requestedType ? itemTypeSchema.safeParse(requestedType) : null;
  const limit = Number(url.searchParams.get("limit") ?? "100");
  return serveCachedJson(request, waitUntil, async () => {
    const sources = await readSources(env.AI_SIGNAL_DB);
    const items = await readItems(env.AI_SIGNAL_DB, sources, {
      limit: Number.isFinite(limit) ? limit : 100,
      ...(parsedType?.success ? { itemType: parsedType.data } : {}),
      ...(url.searchParams.get("provider") ? { provider: url.searchParams.get("provider") as string } : {}),
      ...(url.searchParams.get("q") ? { query: url.searchParams.get("q") as string } : {}),
      ...(url.searchParams.get("since") ? { since: url.searchParams.get("since") as string } : {}),
    });
    return {
      meta: { generatedAt: new Date().toISOString(), count: items.length },
      items,
    };
  });
};
