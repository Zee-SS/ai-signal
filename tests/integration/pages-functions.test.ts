import { afterEach, describe, expect, it } from "vitest";
import { onRequestGet as dashboardEndpoint } from "../../functions/api/dashboard";
import { onRequestGet as itemsEndpoint } from "../../functions/api/items";
import type { DashboardResponse } from "../../shared/schemas/domain";
import type { PagesContext } from "../../shared/types/bindings";
import { developmentDashboard } from "../../src/fixtures/dashboard";

const now = new Date().toISOString();

const sourceRow = {
  id: "src_provider",
  slug: "provider-news",
  name: "Provider News",
  source_type: "rss",
  homepage_url: "https://provider.example/news",
  feed_url: "https://provider.example/feed.xml",
  trust_tier: 3,
  enabled: 1,
  last_success_at: now,
  last_attempt_at: now,
  last_error: null,
  consecutive_failures: 0,
};

const itemRow = {
  id: "item-verified-0001",
  item_type: "model_release",
  title: "Provider releases a coding model",
  summary: "An official short excerpt.",
  url: "https://provider.example/news/model",
  canonical_url: "https://provider.example/news/model",
  source_id: sourceRow.id,
  provider: "Provider",
  author: "Provider team",
  published_at: now,
  fetched_at: now,
  tags_json: JSON.stringify(["coding", "model"]),
  importance_score: 91,
  trend_score: 55,
  external_score: null,
  external_comments: null,
  content_hash: "verified-content-hash",
  raw_metadata_json: JSON.stringify({ importanceReasons: ["Official provider source"] }),
};

class PreparedMock {
  private values: unknown[] = [];

  constructor(
    private readonly sql: string,
    private readonly fail: boolean,
  ) {}

  bind(...values: unknown[]): this {
    this.values = values;
    return this;
  }

  async all<T>(): Promise<{ results: T[]; success: true; meta: Record<string, unknown> }> {
    if (this.fail) throw new Error("D1 unavailable");
    let rows: unknown[] = [];
    if (/FROM sources/i.test(this.sql)) rows = [sourceRow];
    if (/FROM items/i.test(this.sql)) {
      const typeFilter = /item_type = \?/i.test(this.sql) ? this.values[0] : null;
      rows = typeFilter && typeFilter !== itemRow.item_type ? [] : [itemRow];
    }
    return { results: rows as T[], success: true, meta: {} };
  }

  async first<T>(): Promise<T | null> {
    if (this.fail) throw new Error("D1 unavailable");
    return null;
  }
}

function d1Mock(fail = false): D1Database {
  return {
    prepare(sql: string) {
      if (fail) throw new Error("D1 unavailable");
      return new PreparedMock(sql, fail);
    },
  } as unknown as D1Database;
}

function context(request: Request, db: D1Database): PagesContext {
  return {
    request,
    env: { AI_SIGNAL_DB: db, ENVIRONMENT: "test" },
    params: {},
    data: {},
    waitUntil(promise) { void promise; },
    next() { return Promise.resolve(new Response(null, { status: 404 })); },
  };
}

const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");

afterEach(() => {
  if (originalCaches) Object.defineProperty(globalThis, "caches", originalCaches);
  else Reflect.deleteProperty(globalThis, "caches");
});

describe("Pages Functions", () => {
  it("returns a typed consolidated dashboard from D1", async () => {
    const response = await dashboardEndpoint(context(new Request("https://ai-signal.pages.dev/api/dashboard"), d1Mock()));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("stale-while-revalidate=10800");
    const body = await response.json() as DashboardResponse;
    expect(body.meta.environment).toBe("test");
    expect(body.featured[0]?.title).toBe(itemRow.title);
    expect(body.featured[0]?.source.name).toBe(sourceRow.name);
    expect(body.benchmarks).toHaveLength(7);
  });

  it("honours item type filters", async () => {
    const response = await itemsEndpoint(context(
      new Request("https://ai-signal.pages.dev/api/items?type=research&limit=10"),
      d1Mock(),
    ));
    const body = await response.json() as { meta: { count: number }; items: unknown[] };
    expect(body.meta.count).toBe(0);
    expect(body.items).toEqual([]);
  });

  it("returns the last verified cache with an explicit stale state when D1 fails", async () => {
    const cachedPayload = structuredClone(developmentDashboard);
    cachedPayload.meta.fixture = false;
    cachedPayload.meta.environment = "production";
    Object.defineProperty(globalThis, "caches", {
      configurable: true,
      value: {
        default: {
          match: async () => Response.json(cachedPayload),
          put: async () => undefined,
        },
      },
    });

    const response = await dashboardEndpoint(context(new Request("https://ai-signal.pages.dev/api/dashboard"), d1Mock(true)));
    const body = await response.json() as DashboardResponse;
    expect(response.status).toBe(200);
    expect(response.headers.get("X-AI-Signal-Stale")).toBe("true");
    expect(body.meta.isStale).toBe(true);
    expect(body.meta.staleReason).toMatch(/D1 is temporarily unavailable/i);
  });
});
