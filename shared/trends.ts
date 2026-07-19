import { ageInHours } from "./lib/dates";
import type { ApiItem, TrendTopic } from "./schemas/domain";
import { scoreTrend } from "./scoring";

const TOPICS: Array<{ topic: string; terms: string[] }> = [
  { topic: "Coding agents", terms: ["coding-agent", "coding agent", "claude code", "codex", "gemini cli", "aider"] },
  { topic: "Long context", terms: ["long context", "context window", "context length"] },
  { topic: "Open-weight models", terms: ["open-weight", "open weights", "open model"] },
  { topic: "Inference cost", terms: ["pricing", "inference", "price", "cost"] },
  { topic: "Reasoning models", terms: ["reasoning", "reasoning model"] },
  { topic: "Multimodal coding", terms: ["multimodal", "vision", "coding"] },
  { topic: "Agent benchmarks", terms: ["benchmark", "swe-bench", "livecodebench", "polyglot", "swe-rebench"] },
];

const WINDOWS = [
  { window: "24h" as const, hours: 24 },
  { window: "7d" as const, hours: 24 * 7 },
  { window: "30d" as const, hours: 24 * 30 },
];

function matches(item: ApiItem, terms: string[]): boolean {
  const value = `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLocaleLowerCase("en");
  return terms.some((term) => value.includes(term.toLocaleLowerCase("en")));
}

export function buildTrendTopics(items: ApiItem[], now = new Date()): TrendTopic[] {
  return WINDOWS.flatMap(({ window, hours }) => TOPICS.map(({ topic, terms }) => {
    const matching = items.filter((item) => ageInHours(item.publishedAt, now) <= hours && matches(item, terms));
    const sourceIds = new Set(matching.map((item) => item.source.id));
    const trustedSources = new Set(
      matching.filter((item) => item.source.trustTier >= 2).map((item) => item.source.id),
    );
    const newestAge = matching.length
      ? Math.min(...matching.map((item) => ageInHours(item.publishedAt, now)))
      : hours;
    const score = scoreTrend({
      mentionCount: matching.length,
      sourceDiversity: sourceIds.size,
      trustedSourceCount: trustedSources.size,
      hackerNewsPoints: matching.reduce((sum, item) => sum + (item.source.slug === "hacker-news" ? item.externalScore ?? 0 : 0), 0),
      hackerNewsComments: matching.reduce((sum, item) => sum + (item.source.slug === "hacker-news" ? item.externalComments ?? 0 : 0), 0),
      ageHours: newestAge,
    });
    return {
      topic,
      score: matching.length ? score.score : 0,
      mentionCount: matching.length,
      sourceCount: sourceIds.size,
      window,
    };
  }).sort((left, right) => {
    if (left.window !== right.window) return WINDOWS.findIndex((entry) => entry.window === left.window) - WINDOWS.findIndex((entry) => entry.window === right.window);
    return right.score - left.score;
  }));
}
