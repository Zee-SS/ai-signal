import { XMLParser } from "fast-xml-parser";
import { containsAny, stripMarkup, truncate } from "../../../shared/lib/text";
import { canonicalizeUrl } from "../../../shared/lib/url";
import { type ExternalItem, externalItemSchema, type ItemType } from "../../../shared/schemas/domain";
import type { FeedAdapterConfig } from "../../../shared/source-config";
import { fetchWithPolicy } from "./fetcher";
import { type AdapterContext, type AdapterResult, emptyAdapterResult } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
  cdataPropName: "#cdata",
  trimValues: true,
  parseTagValue: false,
  processEntities: true,
});

const MAX_FEED_ENTRIES = 60;

const asArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};

function textValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return textValue(record["#text"] ?? record["#cdata"] ?? record.name ?? "");
}

function linkValue(value: unknown): string {
  if (typeof value === "string") return value;
  const links = asArray(value);
  for (const entry of links) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const href = record["@href"];
    const rel = record["@rel"];
    if (typeof href === "string" && (rel === undefined || rel === "alternate")) return href;
  }
  return "";
}

function validIsoDate(value: unknown): string | null {
  const raw = textValue(value);
  const date = new Date(raw);
  return raw && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function classifyItem(base: ItemType, title: string, summary: string): ItemType {
  const text = `${title} ${summary}`;
  if (containsAny(text, ["deprecat", "sunset", "shutdown", "migration deadline"])) return "deprecation";
  if (containsAny(text, ["pricing", "price change", "context window", "context length"])) return "pricing_change";
  if (base === "announcement" && containsAny(text, ["introducing", "model", "open weights"])) return "model_release";
  return base;
}

interface ParsedFeedEntry {
  title?: unknown;
  link?: unknown;
  id?: unknown;
  guid?: unknown;
  pubDate?: unknown;
  published?: unknown;
  updated?: unknown;
  description?: unknown;
  summary?: unknown;
  content?: unknown;
  author?: unknown;
  creator?: unknown;
  "dc:creator"?: unknown;
}

export function parseFeedXml(
  xml: string,
  config: FeedAdapterConfig,
  sourceSlug: string,
  fetchedAt: string,
  sitemapDates: ReadonlyMap<string, string> = new Map(),
): ExternalItem[] {
  let document: Record<string, unknown>;
  try {
    document = parser.parse(xml) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Malformed XML: ${error instanceof Error ? error.message : "parse failure"}`);
  }

  const rss = document.rss as { channel?: { item?: ParsedFeedEntry | ParsedFeedEntry[] } } | undefined;
  const atom = document.feed as { entry?: ParsedFeedEntry | ParsedFeedEntry[] } | undefined;
  const entries = asArray(rss?.channel?.item ?? atom?.entry).slice(0, MAX_FEED_ENTRIES);
  if (!entries.length) throw new Error("Feed contained no RSS items or Atom entries");

  const parsed: ExternalItem[] = [];
  for (const entry of entries) {
    const title = stripMarkup(textValue(entry.title));
    const summary = truncate(textValue(entry.description ?? entry.summary ?? entry.content), 420);
    const url = linkValue(entry.link) || textValue(entry.guid ?? entry.id);
    const feedDate = validIsoDate(entry.pubDate ?? entry.published ?? entry.updated);
    const sitemapDate = url ? sitemapDates.get(canonicalizeUrl(url)) ?? null : null;
    const publishedAt = feedDate ?? sitemapDate;
    const author = stripMarkup(textValue(entry.author ?? entry.creator ?? entry["dc:creator"]));
    if (!title || !url || !publishedAt) continue;

    const candidate = externalItemSchema.safeParse({
      itemType: classifyItem(config.itemType, title, summary),
      title,
      summary,
      url,
      sourceSlug,
      provider: config.provider,
      author: author || null,
      publishedAt,
      fetchedAt,
      tags: config.tags,
      externalScore: null,
      externalComments: null,
      metadata: {
        feedKind: config.type,
        dateSource: feedDate ? "feed" : "official-sitemap-lastmod",
      },
    });
    if (candidate.success) parsed.push(candidate.data);
  }

  if (!parsed.length) throw new Error("Feed entries did not contain verifiable title, URL, and date fields");
  return parsed;
}

export function parseSitemapDates(xml: string): Map<string, string> {
  let document: Record<string, unknown>;
  try {
    document = parser.parse(xml) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Malformed sitemap XML: ${error instanceof Error ? error.message : "parse failure"}`);
  }

  const urlset = document.urlset as {
    url?: Array<{ loc?: unknown; lastmod?: unknown }> | { loc?: unknown; lastmod?: unknown };
  } | undefined;
  const dates = new Map<string, string>();
  for (const entry of asArray(urlset?.url)) {
    const url = textValue(entry.loc);
    const lastModified = validIsoDate(entry.lastmod);
    if (url && lastModified) dates.set(canonicalizeUrl(url), lastModified);
  }
  if (!dates.size) throw new Error("Official sitemap contained no verifiable URL dates");
  return dates;
}

export async function feedAdapter(context: AdapterContext): Promise<AdapterResult> {
  const config = context.source.adapter;
  if (config.type !== "rss" && config.type !== "atom") throw new Error("Feed adapter received incompatible configuration");
  const [response, sitemapResponse] = await Promise.all([
    fetchWithPolicy(config.url, {}, { timeoutMs: 12_000, retries: 2 }),
    config.dateSitemapUrl
      ? fetchWithPolicy(config.dateSitemapUrl, {}, { timeoutMs: 12_000, retries: 2 })
      : Promise.resolve(null),
  ]);
  const [xml, sitemapXml] = await Promise.all([
    response.text(),
    sitemapResponse ? sitemapResponse.text() : Promise.resolve(null),
  ]);
  const sitemapDates = sitemapXml ? parseSitemapDates(sitemapXml) : new Map<string, string>();
  return {
    ...emptyAdapterResult(),
    items: parseFeedXml(xml, config, context.source.slug, context.fetchedAt, sitemapDates),
  };
}
