import { describe, expect, it } from "vitest";
import { filterModels } from "../../shared/lib/model-filter";
import type { Model } from "../../shared/schemas/domain";

const models: Model[] = [
  {
    id: "open-coder",
    canonicalName: "Open Coder",
    provider: "Lab A",
    providerModelId: "lab-a/open-coder",
    releaseDate: "2026-07-18",
    modelStatus: "available",
    openWeight: true,
    contextLength: 131_072,
    inputModalities: ["text"],
    outputModalities: ["text"],
    inputPrice: null,
    outputPrice: null,
    currency: null,
    officialUrl: "https://lab-a.example/open-coder",
    metadataSourceUrl: "https://metadata.example/models",
    lastVerifiedAt: "2026-07-19T09:00:00.000Z",
    metadata: { tags: ["coding"] },
  },
  {
    id: "closed-general",
    canonicalName: "General Model",
    provider: "Lab B",
    providerModelId: "lab-b/general",
    releaseDate: "2026-07-17",
    modelStatus: "available",
    openWeight: false,
    contextLength: 65_536,
    inputModalities: ["text"],
    outputModalities: ["text"],
    inputPrice: 1,
    outputPrice: 3,
    currency: "USD",
    officialUrl: null,
    metadataSourceUrl: "https://metadata.example/models",
    lastVerifiedAt: "2026-07-19T09:00:00.000Z",
    metadata: {},
  },
];

describe("filterModels", () => {
  it("combines provider, open-weight, coding, and query filters", () => {
    expect(filterModels(models, {
      provider: "Lab A",
      openWeightOnly: true,
      codingFocusedOnly: true,
      query: "coder",
    })).toEqual([models[0]]);
  });

  it("returns no false coding matches", () => {
    expect(filterModels(models, { codingFocusedOnly: true })).toHaveLength(1);
  });
});
