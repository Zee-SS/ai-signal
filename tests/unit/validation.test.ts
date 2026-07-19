import { describe, expect, it } from "vitest";
import { externalItemSchema, modelSchema } from "../../shared/schemas/domain";

describe("external schemas", () => {
  it("accepts a minimal verified item", () => {
    const parsed = externalItemSchema.parse({
      itemType: "announcement",
      title: "Verified announcement",
      url: "https://provider.example/news",
      sourceSlug: "provider",
      publishedAt: "2026-07-18T08:00:00.000Z",
      fetchedAt: "2026-07-19T08:00:00.000Z",
    });
    expect(parsed.tags).toEqual([]);
    expect(parsed.metadata).toEqual({});
  });

  it("rejects unverifiable URLs and dates", () => {
    expect(externalItemSchema.safeParse({
      itemType: "announcement",
      title: "Bad source",
      url: "not-a-url",
      sourceSlug: "provider",
      publishedAt: "yesterday",
      fetchedAt: "2026-07-19T08:00:00.000Z",
    }).success).toBe(false);
  });

  it("does not accept a zero or negative context length", () => {
    const result = modelSchema.safeParse({
      id: "model",
      canonicalName: "Model",
      provider: "Provider",
      providerModelId: "provider/model",
      releaseDate: null,
      modelStatus: "available",
      openWeight: false,
      contextLength: 0,
      inputModalities: ["text"],
      outputModalities: ["text"],
      inputPrice: null,
      outputPrice: null,
      currency: "USD",
      officialUrl: null,
      metadataSourceUrl: "https://metadata.example/models",
      lastVerifiedAt: "2026-07-19T08:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});
