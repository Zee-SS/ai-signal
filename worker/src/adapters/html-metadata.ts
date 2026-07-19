import { stripMarkup, truncate } from "../../../shared/lib/text";
import { externalItemSchema } from "../../../shared/schemas/domain";
import { fetchWithPolicy } from "./fetcher";
import { type AdapterContext, type AdapterResult, emptyAdapterResult } from "./types";

function metaValue(html: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return stripMarkup(match[1]);
  }
  return null;
}

export async function htmlMetadataAdapter(context: AdapterContext): Promise<AdapterResult> {
  const config = context.source.adapter;
  if (config.type !== "html_metadata") throw new Error("HTML metadata adapter received incompatible configuration");
  const response = await fetchWithPolicy(config.url, {}, { timeoutMs: 10_000, retries: 1 });
  const html = await response.text();
  const title = metaValue(html, "og:title");
  const description = metaValue(html, "og:description") ?? metaValue(html, "description");
  const published = metaValue(html, "article:published_time");
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (!title || !published || !canonical) {
    throw new Error("No verifiable article-level Open Graph metadata was available; refusing a page-level scrape");
  }
  const date = new Date(published);
  if (!Number.isFinite(date.getTime())) throw new Error("HTML metadata contained an invalid publication date");
  return {
    ...emptyAdapterResult(),
    items: [externalItemSchema.parse({
      itemType: "announcement",
      title,
      summary: truncate(description ?? "", 420),
      url: canonical,
      sourceSlug: context.source.slug,
      provider: context.source.name,
      author: null,
      publishedAt: date.toISOString(),
      fetchedAt: context.fetchedAt,
      tags: ["html-metadata"],
      externalScore: null,
      externalComments: null,
      metadata: { extraction: "open-graph-only", note: config.note },
    })],
  };
}
