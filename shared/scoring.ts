import { IMPORTANCE_TERMS, IMPORTANCE_WEIGHTS, TREND_WEIGHTS } from "./constants/scoring";
import { containsAny } from "./lib/text";

export interface ImportanceInput {
  title: string;
  summary: string;
  tags: string[];
  itemType: string;
  trustTier: number;
  officialProvider: boolean;
  codingRelevant: boolean;
  corroboratingSources: number;
  ageHours: number;
}

export interface ScoreResult {
  score: number;
  reasons: string[];
}

const roundSignal = (value: number): number => Math.round(Math.max(0, Math.min(100, value)));

export function scoreImportance(input: ImportanceInput): ScoreResult {
  const text = `${input.title} ${input.summary} ${input.tags.join(" ")}`.toLocaleLowerCase("en");
  let score = 0;
  const reasons: string[] = [];

  const add = (condition: boolean, points: number, reason: string): void => {
    if (!condition) return;
    score += points;
    reasons.push(reason);
  };

  add(input.officialProvider, IMPORTANCE_WEIGHTS.officialProvider, "Official provider source");
  add(
    input.itemType === "model_release" || containsAny(text, IMPORTANCE_TERMS.modelRelease),
    IMPORTANCE_WEIGHTS.confirmedModelRelease,
    "Confirmed model or product release",
  );
  add(input.codingRelevant, IMPORTANCE_WEIGHTS.codingRelevance, "High coding relevance");
  add(
    input.itemType === "deprecation" || containsAny(text, IMPORTANCE_TERMS.breaking),
    IMPORTANCE_WEIGHTS.breakingChangeOrDeprecation,
    "Breaking change or deprecation",
  );
  add(
    input.itemType === "benchmark" || containsAny(text, IMPORTANCE_TERMS.benchmark),
    IMPORTANCE_WEIGHTS.benchmarkUpdate,
    "Meaningful benchmark update",
  );
  add(
    input.itemType === "pricing_change" || containsAny(text, IMPORTANCE_TERMS.pricing),
    IMPORTANCE_WEIGHTS.pricingOrContextChange,
    "Pricing or context-window change",
  );
  add(
    input.itemType === "coding_tool" && /codex|claude code|gemini cli|aider|agent/i.test(text),
    IMPORTANCE_WEIGHTS.majorCodingToolRelease,
    "Major coding-tool release",
  );

  const trustPoints = IMPORTANCE_WEIGHTS.trustTier[Math.max(0, Math.min(3, input.trustTier))] ?? 0;
  add(trustPoints > 0, trustPoints, `Trust tier ${input.trustTier}`);

  const corroboration = Math.min(IMPORTANCE_WEIGHTS.maxCorroboration, Math.max(0, input.corroboratingSources - 1) * 4);
  add(corroboration > 0, corroboration, `${input.corroboratingSources} independent sources`);

  const recency = Math.max(0, IMPORTANCE_WEIGHTS.maxRecency * (1 - input.ageHours / (24 * 14)));
  add(recency >= 1, recency, input.ageHours <= 24 ? "Published in the last 24 hours" : "Recent publication");

  return { score: roundSignal(score), reasons };
}

export interface TrendInput {
  mentionCount: number;
  sourceDiversity: number;
  trustedSourceCount: number;
  hackerNewsPoints: number;
  hackerNewsComments: number;
  ageHours: number;
}

export function scoreTrend(input: TrendInput): ScoreResult {
  const reasons: string[] = [];
  const mentions = Math.min(TREND_WEIGHTS.maxMentions, Math.log2(input.mentionCount + 1) * 7);
  const diversity = Math.min(TREND_WEIGHTS.maxSourceDiversity, input.sourceDiversity * 5.5);
  const trust = Math.min(TREND_WEIGHTS.maxTrustedSources, input.trustedSourceCount * 6);
  const engagement = Math.min(
    TREND_WEIGHTS.maxHackerNews,
    Math.log2(input.hackerNewsPoints + input.hackerNewsComments * 2 + 1) * 2.4,
  );
  const recency = TREND_WEIGHTS.maxRecency * 2 ** (-input.ageHours / TREND_WEIGHTS.halfLifeHours);

  if (input.mentionCount > 1) reasons.push(`${input.mentionCount} recent mentions`);
  if (input.sourceDiversity > 1) reasons.push(`${input.sourceDiversity} source types`);
  if (input.trustedSourceCount > 0) reasons.push("Trusted-source activity");
  if (input.hackerNewsPoints + input.hackerNewsComments > 0) reasons.push("Hacker News engagement (popularity only)");
  if (input.ageHours <= 24) reasons.push("Rising in the last 24 hours");

  return { score: roundSignal(mentions + diversity + trust + engagement + recency), reasons };
}
