import { describe, expect, it } from "vitest";
import { deduplicateItems } from "../../shared/lib/dedupe";
import type { NormalizedItem } from "../../shared/schemas/domain";

function item(overrides: Partial<NormalizedItem> = {}): NormalizedItem {
  return {
    id: "item-00000001",
    itemType: "announcement",
    title: "A provider announcement",
    summary: "Summary",
    url: "https://provider.example/news/a",
    canonicalUrl: "https://provider.example/news/a",
    sourceSlug: "provider-news",
    sourceId: "source-provider",
    provider: "Provider",
    author: null,
    publishedAt: "2026-07-18T08:00:00.000Z",
    fetchedAt: "2026-07-18T09:00:00.000Z",
    tags: [],
    importanceScore: 50,
    trendScore: 20,
    externalScore: null,
    externalComments: null,
    contentHash: "content-00000001",
    importanceReasons: [],
    trendReasons: [],
    metadata: {},
    ...overrides,
  };
}

describe("deduplicateItems", () => {
  it("keeps the most recently fetched copy of one canonical source item", () => {
    const older = item();
    const newer = item({ id: "item-00000002", summary: "Corrected", fetchedAt: "2026-07-18T10:00:00.000Z" });
    expect(deduplicateItems([older, newer])).toEqual([newer]);
  });

  it("does not merge separate coverage of the same announcement", () => {
    const official = item();
    const coverage = item({
      id: "item-00000003",
      sourceSlug: "independent-news",
      sourceId: "source-independent",
      url: "https://news.example/coverage",
      canonicalUrl: "https://news.example/coverage",
    });
    expect(deduplicateItems([official, coverage])).toHaveLength(2);
  });
});
