import { BENCHMARK_DEFINITIONS } from "../../shared/constants/benchmarks";
import codingModelSnapshot from "../../shared/data/coding-model-snapshot.json";
import {
  type ApiItem,
  apiItemSchema,
  type BenchmarkDefinition,
  benchmarkResultSchema,
  type CodingLandscapeEntry,
  codingLandscapeEntrySchema,
  codingModelSignalSchema,
  type DashboardResponse,
  eventSchema,
  type ImportantEvent,
  type Model,
  modelSchema,
  type SourceSummary,
  type SyncRun,
  sourceSummarySchema,
  syncRunSchema,
} from "../../shared/schemas/domain";
import { SOURCE_CONFIG } from "../../shared/source-config";
import { buildTrendTopics } from "../../shared/trends";
import { API_CACHE } from "./http";

interface SourceRow {
  id: string;
  slug: string;
  name: string;
  source_type: SourceSummary["sourceType"];
  homepage_url: string;
  feed_url: string | null;
  trust_tier: number;
  enabled: number;
  last_success_at: string | null;
  last_attempt_at: string | null;
  last_error: string | null;
  consecutive_failures: number;
}

interface ItemRow {
  id: string;
  item_type: ApiItem["itemType"];
  title: string;
  summary: string;
  url: string;
  canonical_url: string;
  source_id: string;
  provider: string | null;
  author: string | null;
  published_at: string;
  fetched_at: string;
  tags_json: string;
  importance_score: number;
  trend_score: number;
  external_score: number | null;
  external_comments: number | null;
  content_hash: string;
  raw_metadata_json: string;
}

interface ModelRow {
  id: string;
  canonical_name: string;
  provider: string;
  provider_model_id: string;
  release_date: string | null;
  model_status: string;
  open_weight: number;
  context_length: number | null;
  input_modalities_json: string;
  output_modalities_json: string;
  input_price: number | null;
  output_price: number | null;
  currency: string | null;
  official_url: string | null;
  metadata_source_url: string;
  last_verified_at: string;
  raw_metadata_json: string;
}

interface BenchmarkRow {
  id: string;
  benchmark_slug: string;
  benchmark_track: string;
  model_name: string;
  provider: string | null;
  score: number;
  score_unit: string;
  agent_name: string | null;
  scaffold_name: string | null;
  evaluation_date: string;
  snapshot_date: string;
  source_url: string;
  import_method: "automatic" | "manual";
  notes: string | null;
}

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  provider: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: number;
  source_url: string;
  verified_at: string;
  status: "confirmed" | "predicted" | "cancelled" | "archived";
}

interface SyncRow {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: "running" | "success" | "partial" | "failed";
  sources_attempted: number;
  sources_succeeded: number;
  items_inserted: number;
  items_updated: number;
  error_summary: string | null;
  duration_ms: number | null;
}

const parseJson = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

function sourceStatus(row: SourceRow): SourceSummary["status"] {
  if (!row.enabled) return "disabled";
  if (!row.last_attempt_at) return "pending";
  if (row.last_error && row.consecutive_failures >= 3) return "unavailable";
  if (row.last_error || row.consecutive_failures > 0) return "degraded";
  return "healthy";
}

function mapSource(row: SourceRow): SourceSummary {
  return sourceSummarySchema.parse({
    id: row.id,
    slug: row.slug,
    name: row.name,
    sourceType: row.source_type,
    homepageUrl: row.homepage_url,
    feedUrl: row.feed_url,
    trustTier: row.trust_tier,
    enabled: Boolean(row.enabled),
    status: sourceStatus(row),
    lastSuccessAt: row.last_success_at,
    lastAttemptAt: row.last_attempt_at,
    lastError: row.last_error,
    consecutiveFailures: row.consecutive_failures,
  });
}

function configuredSources(): SourceSummary[] {
  return SOURCE_CONFIG.map((source) => sourceSummarySchema.parse({
    id: source.id,
    slug: source.slug,
    name: source.name,
    sourceType: source.adapter.type,
    homepageUrl: source.homepageUrl,
    feedUrl: "url" in source.adapter ? source.adapter.url : null,
    trustTier: source.trustTier,
    enabled: source.enabled,
    status: source.enabled ? "pending" : "disabled",
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastError: null,
    consecutiveFailures: 0,
  }));
}

function mapItem(row: ItemRow, source: SourceSummary): ApiItem {
  const metadata = parseJson<Record<string, unknown>>(row.raw_metadata_json, {});
  return apiItemSchema.parse({
    id: row.id,
    itemType: row.item_type,
    title: row.title,
    summary: row.summary,
    url: row.url,
    canonicalUrl: row.canonical_url,
    sourceSlug: source.slug,
    sourceId: row.source_id,
    source,
    provider: row.provider,
    author: row.author,
    publishedAt: row.published_at,
    fetchedAt: row.fetched_at,
    tags: parseJson<string[]>(row.tags_json, []),
    importanceScore: row.importance_score,
    trendScore: row.trend_score,
    externalScore: row.external_score,
    externalComments: row.external_comments,
    contentHash: row.content_hash,
    importanceReasons: Array.isArray(metadata.importanceReasons) ? metadata.importanceReasons : [],
    trendReasons: Array.isArray(metadata.trendReasons) ? metadata.trendReasons : [],
    metadata,
  });
}

function mapModel(row: ModelRow): Model {
  return modelSchema.parse({
    id: row.id,
    canonicalName: row.canonical_name,
    provider: row.provider,
    providerModelId: row.provider_model_id,
    releaseDate: row.release_date,
    modelStatus: row.model_status,
    openWeight: Boolean(row.open_weight),
    contextLength: row.context_length,
    inputModalities: parseJson<string[]>(row.input_modalities_json, []),
    outputModalities: parseJson<string[]>(row.output_modalities_json, []),
    inputPrice: row.input_price,
    outputPrice: row.output_price,
    currency: row.currency,
    officialUrl: row.official_url,
    metadataSourceUrl: row.metadata_source_url,
    lastVerifiedAt: row.last_verified_at,
    metadata: parseJson<Record<string, unknown>>(row.raw_metadata_json, {}),
  });
}

function mapEvent(row: EventRow): ImportantEvent {
  return eventSchema.parse({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    provider: row.provider,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: Boolean(row.all_day),
    sourceUrl: row.source_url,
    verifiedAt: row.verified_at,
    status: row.status,
  });
}

function mapSync(row: SyncRow | null): SyncRun | null {
  if (!row) return null;
  return syncRunSchema.parse({
    id: row.id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    sourcesAttempted: row.sources_attempted,
    sourcesSucceeded: row.sources_succeeded,
    itemsInserted: row.items_inserted,
    itemsUpdated: row.items_updated,
    errorSummary: row.error_summary,
    durationMs: row.duration_ms,
  });
}

export async function readSources(db: D1Database): Promise<SourceSummary[]> {
  const response = await db.prepare("SELECT * FROM sources ORDER BY enabled DESC, name ASC").all<SourceRow>();
  return response.results.length ? response.results.map(mapSource) : configuredSources();
}

export async function readItems(
  db: D1Database,
  sources: SourceSummary[],
  options: { limit?: number; itemType?: string; provider?: string; query?: string; since?: string } = {},
): Promise<ApiItem[]> {
  const clauses: string[] = [];
  const values: Array<string | number> = [];
  if (options.itemType) { clauses.push("item_type = ?"); values.push(options.itemType); }
  if (options.provider) { clauses.push("provider = ?"); values.push(options.provider); }
  if (options.since) { clauses.push("published_at >= ?"); values.push(options.since); }
  if (options.query) {
    clauses.push("(title LIKE ? OR summary LIKE ? OR provider LIKE ? OR tags_json LIKE ?)");
    const query = `%${options.query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    values.push(query, query, query, query);
  }
  const limit = Math.min(200, Math.max(1, options.limit ?? 120));
  values.push(limit);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const response = await db.prepare(`
    SELECT * FROM items ${where}
    ORDER BY published_at DESC, importance_score DESC
    LIMIT ?
  `).bind(...values).all<ItemRow>();
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  return response.results.flatMap((row) => {
    const source = sourceMap.get(row.source_id);
    return source ? [mapItem(row, source)] : [];
  });
}

async function readRepositoryItems(db: D1Database, sources: SourceSummary[]): Promise<ApiItem[]> {
  const sourceIds = SOURCE_CONFIG
    .filter((source) => source.adapter.type === "github_repository")
    .map((source) => source.id);
  if (!sourceIds.length) return [];
  const placeholders = sourceIds.map(() => "?").join(", ");
  const response = await db.prepare(`
    SELECT * FROM items
    WHERE source_id IN (${placeholders})
    ORDER BY fetched_at DESC
    LIMIT 100
  `).bind(...sourceIds).all<ItemRow>();
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  return response.results.flatMap((row) => {
    const source = sourceMap.get(row.source_id);
    return source ? [mapItem(row, source)] : [];
  });
}

export async function readModels(db: D1Database, limit = 100): Promise<Model[]> {
  const response = await db.prepare(`
    SELECT * FROM models
    ORDER BY COALESCE(release_date, substr(last_verified_at, 1, 10)) DESC, canonical_name ASC
    LIMIT ?
  `).bind(Math.min(200, Math.max(1, limit))).all<ModelRow>();
  return response.results.map(mapModel);
}

export async function readBenchmarks(db: D1Database): Promise<BenchmarkDefinition[]> {
  const response = await db.prepare(`
    SELECT * FROM benchmark_results
    ORDER BY benchmark_slug, benchmark_track, score DESC, snapshot_date DESC
  `).all<BenchmarkRow>();
  const results = response.results.map((row) => benchmarkResultSchema.parse({
    id: row.id,
    benchmarkSlug: row.benchmark_slug,
    benchmarkTrack: row.benchmark_track,
    modelName: row.model_name,
    provider: row.provider,
    score: row.score,
    scoreUnit: row.score_unit,
    agentName: row.agent_name,
    scaffoldName: row.scaffold_name,
    evaluationDate: row.evaluation_date,
    snapshotDate: row.snapshot_date,
    sourceUrl: row.source_url,
    importMethod: row.import_method,
    notes: row.notes,
  }));
  return BENCHMARK_DEFINITIONS.map((definition) => {
    const matching = results.filter((result) => result.benchmarkSlug === definition.slug);
    const snapshots = matching.map((result) => result.snapshotDate).sort().reverse();
    return { ...definition, results: matching, lastSnapshotAt: snapshots[0] ?? null };
  });
}

export async function readEvents(db: D1Database, includeArchived = false): Promise<ImportantEvent[]> {
  const response = await db.prepare(`
    SELECT * FROM events
    WHERE (? = 1 OR (status IN ('confirmed', 'predicted') AND COALESCE(ends_at, starts_at) >= ?))
    ORDER BY starts_at ASC
    LIMIT 100
  `).bind(includeArchived ? 1 : 0, new Date().toISOString()).all<EventRow>();
  return response.results.map(mapEvent);
}

function buildCodingLandscape(items: ApiItem[], sources: SourceSummary[], now: Date): CodingLandscapeEntry[] {
  const repositorySources = SOURCE_CONFIG.filter((source) => source.adapter.type === "github_repository");
  const matchingItems = new Map(
    items
      .filter((item) => typeof item.metadata.repository === "string" && item.tags.includes("github-activity"))
      .map((item) => [item.metadata.repository as string, item]),
  );
  const maximumLogStars = Math.max(
    1,
    ...Array.from(matchingItems.values(), (item) => Math.log10((typeof item.metadata.stars === "number" ? item.metadata.stars : 0) + 1)),
  );
  return repositorySources.map((source) => {
    const config = source.adapter;
    if (config.type !== "github_repository") throw new Error("Unexpected coding landscape source");
    const item = matchingItems.get(config.repository);
    const sourceHealth = sources.find((entry) => entry.id === source.id)?.status ?? "pending";
    const stars = typeof item?.metadata.stars === "number" ? item.metadata.stars : null;
    const pushedAt = typeof item?.metadata.pushedAt === "string" ? item.metadata.pushedAt : null;
    const daysSincePush = pushedAt ? Math.max(0, (now.getTime() - new Date(pushedAt).getTime()) / 86_400_000) : null;
    const momentumScore = stars === null || daysSincePush === null
      ? null
      : Math.round(Math.min(100, (Math.log10(stars + 1) / maximumLogStars) * 65 + Math.max(0, 35 - daysSincePush / 3)));
    return codingLandscapeEntrySchema.parse({
      id: source.id,
      name: config.projectName,
      provider: config.provider,
      kind: config.kind,
      surface: config.surface,
      description: config.description,
      url: source.homepageUrl,
      repository: config.repository,
      stars,
      forks: typeof item?.metadata.forks === "number" ? item.metadata.forks : null,
      openIssues: typeof item?.metadata.openIssues === "number" ? item.metadata.openIssues : null,
      pushedAt,
      fetchedAt: item?.fetchedAt ?? null,
      momentumScore,
      sourceStatus: sourceHealth,
    });
  }).sort((left, right) => (right.momentumScore ?? -1) - (left.momentumScore ?? -1));
}

export async function readLatestSync(db: D1Database): Promise<SyncRun | null> {
  const row = await db.prepare("SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 1").first<SyncRow>();
  return mapSync(row);
}

export async function readDashboard(db: D1Database, environment: DashboardResponse["meta"]["environment"]): Promise<DashboardResponse> {
  const sources = await readSources(db);
  const [items, repositoryItems, models, benchmarks, events, latestSync] = await Promise.all([
    readItems(db, sources, { limit: 160 }),
    readRepositoryItems(db, sources),
    readModels(db, 100),
    readBenchmarks(db),
    readEvents(db),
    readLatestSync(db),
  ]);
  const generatedAt = new Date().toISOString();
  const lastSuccessfulRefreshAt = sources
    .filter((source) => source.enabled && source.lastSuccessAt)
    .map((source) => source.lastSuccessAt as string)
    .sort()
    .reverse()[0] ?? null;
  const staleAge = lastSuccessfulRefreshAt ? Date.now() - new Date(lastSuccessfulRefreshAt).getTime() : Number.POSITIVE_INFINITY;
  const isStale = staleAge > 6 * 3_600_000;
  const staleReason = !lastSuccessfulRefreshAt
    ? "Scheduled ingestion has not completed yet."
    : isStale
      ? "The last successful source refresh is more than six hours old."
      : null;
  const featured = [...items]
    .filter((item) => item.itemType !== "community")
    .sort((left, right) => right.importanceScore - left.importanceScore || right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, 5);
  return {
    meta: {
      generatedAt,
      lastSuccessfulRefreshAt,
      isStale,
      staleReason,
      environment,
      fixture: false,
      version: "1.1.0",
      timezone: "Africa/Johannesburg",
      cache: API_CACHE,
    },
    featured,
    items,
    models,
    benchmarks,
    events,
    trends: buildTrendTopics(items, new Date(generatedAt)),
    codingModels: codingModelSignalSchema.array().parse(codingModelSnapshot),
    codingLandscape: buildCodingLandscape(repositoryItems, sources, new Date(generatedAt)),
    sources,
    latestSync,
  };
}
