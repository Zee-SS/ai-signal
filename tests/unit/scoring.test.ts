import { describe, expect, it } from "vitest";
import { scoreImportance, scoreTrend } from "../../shared/scoring";

describe("transparent scoring", () => {
  it("ranks an official breaking coding release above a generic mention", () => {
    const important = scoreImportance({
      title: "Codex 2.0 breaking change",
      summary: "Migration required for the coding agent.",
      tags: ["coding-agent"],
      itemType: "coding_tool",
      trustTier: 3,
      officialProvider: true,
      codingRelevant: true,
      corroboratingSources: 2,
      ageHours: 2,
    });
    const generic = scoreImportance({
      title: "Thoughts about AI",
      summary: "A general discussion.",
      tags: [],
      itemType: "community",
      trustTier: 0,
      officialProvider: false,
      codingRelevant: false,
      corroboratingSources: 1,
      ageHours: 200,
    });
    expect(important.score).toBeGreaterThan(generic.score);
    expect(important.reasons).toContain("Breaking change or deprecation");
    expect(important.score).toBeLessThanOrEqual(100);
  });

  it("uses community engagement only as one bounded trend signal", () => {
    const score = scoreTrend({
      mentionCount: 4,
      sourceDiversity: 3,
      trustedSourceCount: 2,
      hackerNewsPoints: 1_000_000,
      hackerNewsComments: 1_000_000,
      ageHours: 6,
    });
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.reasons).toContain("Hacker News engagement (popularity only)");
  });
});
