import { z } from "zod";

export const itemTypeSchema = z.enum([
  "announcement",
  "model_release",
  "coding_tool",
  "benchmark",
  "research",
  "open_weight_model",
  "pricing_change",
  "deprecation",
  "community",
]);

export const sourceTypeSchema = z.enum([
  "rss",
  "atom",
  "github_releases",
  "json_api",
  "arxiv",
  "hacker_news",
  "manual_json",
  "html_metadata",
]);

export const sourceStatusSchema = z.enum(["healthy", "degraded", "unavailable", "pending", "disabled"]);

export const sourceSummarySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  sourceType: sourceTypeSchema,
  homepageUrl: z.url(),
  feedUrl: z.url().nullable(),
  trustTier: z.number().int().min(0).max(3),
  enabled: z.boolean(),
  status: sourceStatusSchema,
  lastSuccessAt: z.iso.datetime().nullable(),
  lastAttemptAt: z.iso.datetime().nullable(),
  lastError: z.string().nullable(),
  consecutiveFailures: z.number().int().nonnegative(),
});

export const externalItemSchema = z.object({
  itemType: itemTypeSchema,
  title: z.string().trim().min(3).max(500),
  summary: z.string().trim().max(2_000).default(""),
  url: z.url(),
  sourceSlug: z.string().min(1),
  provider: z.string().trim().max(120).nullable().default(null),
  author: z.string().trim().max(240).nullable().default(null),
  publishedAt: z.iso.datetime(),
  fetchedAt: z.iso.datetime(),
  tags: z.array(z.string().trim().min(1).max(80)).max(24).default([]),
  externalScore: z.number().finite().nonnegative().nullable().default(null),
  externalComments: z.number().int().nonnegative().nullable().default(null),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const normalizedItemSchema = externalItemSchema.extend({
  id: z.string().min(8),
  canonicalUrl: z.url(),
  sourceId: z.string().min(1),
  importanceScore: z.number().min(0).max(100),
  trendScore: z.number().min(0).max(100),
  contentHash: z.string().min(8),
  importanceReasons: z.array(z.string()).default([]),
  trendReasons: z.array(z.string()).default([]),
});

export const apiItemSchema = normalizedItemSchema.extend({
  source: sourceSummarySchema,
  isRead: z.boolean().optional(),
  isBookmarked: z.boolean().optional(),
});

export const modelSchema = z.object({
  id: z.string().min(1),
  canonicalName: z.string().min(1),
  provider: z.string().min(1),
  providerModelId: z.string().min(1),
  releaseDate: z.iso.date().nullable(),
  modelStatus: z.string().min(1),
  openWeight: z.boolean(),
  contextLength: z.number().int().positive().nullable(),
  inputModalities: z.array(z.string()),
  outputModalities: z.array(z.string()),
  inputPrice: z.number().nonnegative().nullable(),
  outputPrice: z.number().nonnegative().nullable(),
  currency: z.string().nullable(),
  officialUrl: z.url().nullable(),
  metadataSourceUrl: z.url(),
  lastVerifiedAt: z.iso.datetime(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const benchmarkResultSchema = z.object({
  id: z.string().min(1),
  benchmarkSlug: z.string().min(1),
  benchmarkTrack: z.string().min(1),
  modelName: z.string().min(1),
  provider: z.string().nullable(),
  score: z.number().finite(),
  scoreUnit: z.string().min(1),
  agentName: z.string().nullable(),
  scaffoldName: z.string().nullable(),
  evaluationDate: z.iso.date(),
  snapshotDate: z.iso.date(),
  sourceUrl: z.url(),
  importMethod: z.enum(["automatic", "manual"]),
  notes: z.string().nullable(),
});

export const benchmarkDefinitionSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  leaderboardUrl: z.url(),
  sourceKind: z.enum(["official-machine-readable", "official-repository", "curated-snapshot"]),
  results: z.array(benchmarkResultSchema),
  lastSnapshotAt: z.iso.date().nullable(),
});

export const eventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().min(1),
  provider: z.string().nullable(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime().nullable(),
  allDay: z.boolean(),
  sourceUrl: z.url(),
  verifiedAt: z.iso.datetime(),
  status: z.enum(["confirmed", "cancelled", "archived"]),
});

export const trendTopicSchema = z.object({
  topic: z.string().min(1),
  score: z.number().min(0).max(100),
  mentionCount: z.number().int().nonnegative(),
  sourceCount: z.number().int().nonnegative(),
  window: z.enum(["24h", "7d", "30d"]),
});

export const syncRunSchema = z.object({
  id: z.string(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
  status: z.enum(["running", "success", "partial", "failed"]),
  sourcesAttempted: z.number().int().nonnegative(),
  sourcesSucceeded: z.number().int().nonnegative(),
  itemsInserted: z.number().int().nonnegative(),
  itemsUpdated: z.number().int().nonnegative(),
  errorSummary: z.string().nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
});

export const dashboardMetaSchema = z.object({
  generatedAt: z.iso.datetime(),
  lastSuccessfulRefreshAt: z.iso.datetime().nullable(),
  isStale: z.boolean(),
  staleReason: z.string().nullable(),
  environment: z.enum(["production", "development", "test"]),
  fixture: z.boolean(),
  version: z.string(),
  timezone: z.literal("Africa/Johannesburg"),
  cache: z.object({
    maxAgeSeconds: z.number().int().nonnegative(),
    staleWhileRevalidateSeconds: z.number().int().nonnegative(),
  }),
});

export const dashboardResponseSchema = z.object({
  meta: dashboardMetaSchema,
  featured: z.array(apiItemSchema).max(5),
  items: z.array(apiItemSchema),
  models: z.array(modelSchema),
  benchmarks: z.array(benchmarkDefinitionSchema),
  events: z.array(eventSchema),
  trends: z.array(trendTopicSchema),
  sources: z.array(sourceSummarySchema),
  latestSync: syncRunSchema.nullable(),
});

export type ItemType = z.infer<typeof itemTypeSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type SourceSummary = z.infer<typeof sourceSummarySchema>;
export type ExternalItem = z.infer<typeof externalItemSchema>;
export type NormalizedItem = z.infer<typeof normalizedItemSchema>;
export type ApiItem = z.infer<typeof apiItemSchema>;
export type Model = z.infer<typeof modelSchema>;
export type BenchmarkResult = z.infer<typeof benchmarkResultSchema>;
export type BenchmarkDefinition = z.infer<typeof benchmarkDefinitionSchema>;
export type ImportantEvent = z.infer<typeof eventSchema>;
export type TrendTopic = z.infer<typeof trendTopicSchema>;
export type SyncRun = z.infer<typeof syncRunSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
