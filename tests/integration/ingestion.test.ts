import { afterEach, describe, expect, it, vi } from "vitest";
import { ENABLED_SOURCES } from "../../shared/source-config";
import type { CloudflareEnv } from "../../shared/types/bindings";
import type { AdapterContext, AdapterResult } from "../../worker/src/adapters/types";

vi.mock("../../worker/src/adapters", () => ({
  getAdapter: () => async (context: AdapterContext): Promise<AdapterResult> => {
    if (context.source.slug === "deepmind-news") throw new Error("Fixture source timeout");
    const item = context.source.slug === "openai-news" ? [{
      itemType: "model_release" as const,
      title: "Fixture official model release",
      summary: "Fixture adapter response for an ingestion integration test.",
      url: "https://openai.com/index/fixture-release",
      sourceSlug: context.source.slug,
      provider: "OpenAI",
      author: null,
      publishedAt: "2026-07-19T08:00:00.000Z",
      fetchedAt: context.fetchedAt,
      tags: ["coding"],
      externalScore: null,
      externalComments: null,
      metadata: {},
    }] : [];
    return { items: item, models: [], benchmarks: [], events: [] };
  },
}));

import { runIngestion } from "../../worker/src/ingestion/run";

class IngestionStatementMock {
  constructor(private readonly sql: string) {}

  bind(..._values: unknown[]): this { return this; }

  async run(): Promise<{ success: true; meta: Record<string, unknown> }> {
    return { success: true, meta: {} };
  }

  async all<T>(): Promise<{ results: T[]; success: true; meta: Record<string, unknown> }> {
    const rows = /SELECT canonical_url FROM items/i.test(this.sql) ? [] : [];
    return { results: rows as T[], success: true, meta: {} };
  }
}

function ingestionD1(): D1Database {
  return {
    prepare(sql: string) { return new IngestionStatementMock(sql); },
    async batch<T>(statements: D1PreparedStatement[]) {
      return statements.map(() => ({ success: true, results: [], meta: {} })) as unknown as D1Result<T>[];
    },
  } as unknown as D1Database;
}

afterEach(() => vi.restoreAllMocks());

describe("scheduled ingestion", () => {
  it("isolates one source failure and persists results from the others", async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const env: CloudflareEnv = { AI_SIGNAL_DB: ingestionD1(), ENVIRONMENT: "test" };
    const result = await runIngestion(env);
    expect(result.status).toBe("partial");
    expect(result.sourcesAttempted).toBe(ENABLED_SOURCES.length);
    expect(result.sourcesSucceeded).toBe(ENABLED_SOURCES.length - 1);
    expect(result.itemsInserted).toBe(1);
    expect(result.errors).toEqual([{ source: "deepmind-news", message: "Fixture source timeout" }]);
  });
});
