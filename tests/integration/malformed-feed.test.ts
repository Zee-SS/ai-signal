import { afterEach, describe, expect, it, vi } from "vitest";
import type { SourceDefinition } from "../../shared/source-config";
import type { CloudflareEnv } from "../../shared/types/bindings";
import { feedAdapter } from "../../worker/src/adapters/feed";

const source: SourceDefinition = {
  id: "src_fixture",
  slug: "fixture-feed",
  name: "Fixture Feed",
  homepageUrl: "https://provider.example/",
  trustTier: 3,
  enabled: true,
  adapter: {
    type: "rss",
    url: "https://provider.example/feed.xml",
    itemType: "announcement",
    provider: "Provider",
    tags: [],
  },
};

afterEach(() => vi.restoreAllMocks());

describe("feed adapter failure handling", () => {
  it("surfaces malformed XML as an isolated adapter error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("<rss><channel><item>", { status: 200 }));
    const env = { AI_SIGNAL_DB: {} as D1Database } satisfies CloudflareEnv;
    await expect(feedAdapter({ source, env, fetchedAt: "2026-07-19T09:00:00.000Z" }))
      .rejects.toThrow(/Malformed XML|no RSS items|did not contain verifiable/i);
  });
});
