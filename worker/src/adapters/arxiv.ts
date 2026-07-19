import { containsAny } from "../../../shared/lib/text";
import type { ExternalItem } from "../../../shared/schemas/domain";
import type { ArxivAdapterConfig } from "../../../shared/source-config";
import { parseFeedXml } from "./feed";
import { fetchWithPolicy } from "./fetcher";
import { type AdapterContext, type AdapterResult, emptyAdapterResult } from "./types";

function buildQuery(config: ArxivAdapterConfig): string {
  const categories = config.categories.map((category) => `cat:${category}`).join(" OR ");
  const terms = config.terms.map((term) => `all:"${term}"`).join(" OR ");
  const params = new URLSearchParams({
    search_query: `(${categories}) AND (${terms})`,
    start: "0",
    max_results: String(config.maxResults),
    sortBy: "submittedDate",
    sortOrder: "descending",
  });
  return `${config.url}?${params.toString()}`;
}

export async function arxivAdapter(context: AdapterContext): Promise<AdapterResult> {
  const config = context.source.adapter;
  if (config.type !== "arxiv") throw new Error("arXiv adapter received incompatible configuration");
  const response = await fetchWithPolicy(buildQuery(config), {}, { timeoutMs: 18_000, retries: 2 });
  const xml = await response.text();
  const feedConfig = {
    type: "atom" as const,
    url: config.url,
    itemType: "research" as const,
    provider: null,
    tags: ["research", "arxiv"],
  };
  const parsed = parseFeedXml(xml, feedConfig, context.source.slug, context.fetchedAt);
  const relevant: ExternalItem[] = parsed
    .filter((item) => containsAny(`${item.title} ${item.summary}`, config.terms))
    .slice(0, 10)
    .map((item) => ({ ...item, provider: "arXiv", metadata: { ...item.metadata, relevanceFiltered: true } }));
  if (!relevant.length) throw new Error("arXiv returned no high-relevance papers for the configured terms");
  return { ...emptyAdapterResult(), items: relevant };
}
