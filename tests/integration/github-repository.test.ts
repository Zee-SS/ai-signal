import { afterEach, describe, expect, it, vi } from "vitest";
import type { SourceDefinition } from "../../shared/source-config";
import type { CloudflareEnv } from "../../shared/types/bindings";
import { githubRepositoryAdapter } from "../../worker/src/adapters/github";

const source: SourceDefinition = {
  id: "src_fixture_repository",
  slug: "fixture-repository",
  name: "Fixture repository activity",
  homepageUrl: "https://github.com/example/agent",
  trustTier: 2,
  enabled: true,
  adapter: {
    type: "github_repository",
    repository: "example/agent",
    provider: "Example",
    projectName: "Example Agent",
    kind: "agent",
    surface: "browser",
    description: "Fixture browser agent repository.",
    tags: ["coding-agent", "browser"],
  },
};

afterEach(() => vi.restoreAllMocks());

describe("GitHub repository activity adapter", () => {
  it("validates and normalises community-interest metadata without calling it quality", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      html_url: "https://github.com/example/agent",
      stargazers_count: 4200,
      forks_count: 310,
      open_issues_count: 27,
      pushed_at: "2026-07-20T08:00:00.000Z",
      archived: false,
      disabled: false,
      license: { spdx_id: "MIT" },
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const env = { AI_SIGNAL_DB: {} as D1Database, GITHUB_TOKEN: "fixture-token" } satisfies CloudflareEnv;

    const result = await githubRepositoryAdapter({ source, env, fetchedAt: "2026-07-20T09:00:00.000Z" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      itemType: "coding_tool",
      title: "Example Agent",
      externalScore: 4200,
      externalComments: 27,
      tags: expect.arrayContaining(["github-activity", "agent", "browser"]),
      metadata: expect.objectContaining({ stars: 4200, forks: 310, qualitySignal: false, surface: "browser" }),
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("/repos/example/agent"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer fixture-token" }),
    }));
  });
});
