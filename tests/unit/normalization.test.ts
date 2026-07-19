import { describe, expect, it } from "vitest";
import { SOURCE_CONFIG } from "../../shared/source-config";
import { normalizeExternalItem } from "../../worker/src/ingestion/normalize";

describe("external item normalization", () => {
  it("keeps item identity stable when a source edits its excerpt", async () => {
    const source = SOURCE_CONFIG.find((entry) => entry.slug === "claude-code-releases");
    expect(source).toBeDefined();
    if (!source) return;

    const base = {
      itemType: "coding_tool" as const,
      title: "claude-code v2.1.212",
      url: "https://github.com/anthropics/claude-code/releases/tag/v2.1.212",
      sourceSlug: source.slug,
      provider: "Anthropic",
      author: null,
      publishedAt: "2026-07-19T08:00:00.000Z",
      fetchedAt: "2026-07-19T09:00:00.000Z",
      tags: ["coding-agent"],
      externalScore: null,
      externalComments: null,
      metadata: {},
    };
    const first = await normalizeExternalItem({ ...base, summary: "## What's changed" }, source);
    const edited = await normalizeExternalItem({ ...base, summary: "What's changed" }, source);

    expect(edited.id).toBe(first.id);
    expect(edited.contentHash).not.toBe(first.contentHash);
  });
});
