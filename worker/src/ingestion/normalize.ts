import { CODING_TERMS } from "../../../shared/constants/scoring";
import { ageInHours } from "../../../shared/lib/dates";
import { sha256, stableId } from "../../../shared/lib/hash";
import { containsAny, normalizeTitle } from "../../../shared/lib/text";
import { canonicalizeUrl } from "../../../shared/lib/url";
import {
  type ExternalItem,
  externalItemSchema,
  type NormalizedItem,
  normalizedItemSchema,
} from "../../../shared/schemas/domain";
import { scoreImportance, scoreTrend } from "../../../shared/scoring";
import type { SourceDefinition } from "../../../shared/source-config";

export async function normalizeExternalItem(
  raw: ExternalItem,
  source: SourceDefinition,
  now = new Date(),
): Promise<NormalizedItem> {
  const item = externalItemSchema.parse(raw);
  const canonicalUrl = canonicalizeUrl(item.url);
  const normalizedTitle = normalizeTitle(item.title);
  const contentHash = await sha256([
    source.slug,
    canonicalUrl,
    normalizedTitle,
    item.publishedAt.slice(0, 10),
    item.summary,
  ].join("|"));
  // A source item keeps the same identity when its excerpt or metadata changes.
  // The content hash remains available for detecting those changes.
  const id = await stableId("item", `${source.id}|${canonicalUrl}`);
  const codingRelevant = containsAny(
    `${item.title} ${item.summary} ${item.tags.join(" ")}`,
    CODING_TERMS,
  );
  const importance = scoreImportance({
    title: item.title,
    summary: item.summary,
    tags: item.tags,
    itemType: item.itemType,
    trustTier: source.trustTier,
    officialProvider: source.trustTier === 3 && source.adapter.type !== "manual_json",
    codingRelevant,
    corroboratingSources: 1,
    ageHours: ageInHours(item.publishedAt, now),
  });
  const trend = scoreTrend({
    mentionCount: 1,
    sourceDiversity: 1,
    trustedSourceCount: source.trustTier >= 2 ? 1 : 0,
    hackerNewsPoints: source.adapter.type === "hacker_news" ? item.externalScore ?? 0 : 0,
    hackerNewsComments: source.adapter.type === "hacker_news" ? item.externalComments ?? 0 : 0,
    ageHours: ageInHours(item.publishedAt, now),
  });

  return normalizedItemSchema.parse({
    ...item,
    id,
    canonicalUrl,
    sourceId: source.id,
    importanceScore: importance.score,
    trendScore: trend.score,
    contentHash,
    importanceReasons: importance.reasons,
    trendReasons: trend.reasons,
    metadata: {
      ...item.metadata,
      importanceReasons: importance.reasons,
      trendReasons: trend.reasons,
      codingRelevant,
    },
  });
}

export async function normalizeExternalItems(
  items: ExternalItem[],
  source: SourceDefinition,
  now = new Date(),
): Promise<NormalizedItem[]> {
  const results = await Promise.allSettled(items.map((item) => normalizeExternalItem(item, source, now)));
  return results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
}
