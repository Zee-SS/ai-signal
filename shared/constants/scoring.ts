export const IMPORTANCE_WEIGHTS = {
  officialProvider: 14,
  confirmedModelRelease: 24,
  codingRelevance: 18,
  breakingChangeOrDeprecation: 22,
  benchmarkUpdate: 14,
  pricingOrContextChange: 14,
  majorCodingToolRelease: 20,
  trustTier: [0, 2, 4, 6],
  maxCorroboration: 12,
  maxRecency: 10,
} as const;

export const TREND_WEIGHTS = {
  maxMentions: 28,
  maxSourceDiversity: 22,
  maxTrustedSources: 18,
  maxHackerNews: 18,
  maxRecency: 14,
  halfLifeHours: 72,
} as const;

export const CODING_TERMS = [
  "code generation",
  "coding",
  "software engineering",
  "repository",
  "agent",
  "tool use",
  "swe-bench",
  "terminal",
  "cli",
] as const;

export const IMPORTANCE_TERMS = {
  modelRelease: ["introducing", "model release", "released", "launch"],
  breaking: ["breaking change", "deprecat", "sunset", "migration deadline", "shutdown"],
  pricing: ["pricing", "price", "context window", "context length"],
  benchmark: ["benchmark", "leaderboard", "swe-bench", "livecodebench", "polyglot"],
} as const;
