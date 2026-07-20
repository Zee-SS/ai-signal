import type {
  BenchmarkResult,
  ImportantEvent,
  Model,
  NormalizedItem,
} from "../../../shared/schemas/domain";
import { SOURCE_CONFIG, type SourceDefinition } from "../../../shared/source-config";
import type { AdapterResult } from "../adapters/types";

const chunks = <T>(items: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
};

function feedUrl(source: SourceDefinition): string | null {
  const adapter = source.adapter;
  if ("url" in adapter) return adapter.url;
  if (adapter.type === "github_releases") return `https://api.github.com/repos/${adapter.repository}/releases`;
  if (adapter.type === "github_repository") return `https://api.github.com/repos/${adapter.repository}`;
  if (adapter.type === "hacker_news") return adapter.baseUrl;
  return null;
}

export async function syncSourceDefinitions(db: D1Database, now: string): Promise<void> {
  const statements = SOURCE_CONFIG.map((source) => db.prepare(`
    INSERT INTO sources (
      id, slug, name, source_type, homepage_url, feed_url, trust_tier, enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      name = excluded.name,
      source_type = excluded.source_type,
      homepage_url = excluded.homepage_url,
      feed_url = excluded.feed_url,
      trust_tier = excluded.trust_tier,
      enabled = excluded.enabled,
      updated_at = excluded.updated_at
  `).bind(
    source.id,
    source.slug,
    source.name,
    source.adapter.type,
    source.homepageUrl,
    feedUrl(source),
    source.trustTier,
    source.enabled ? 1 : 0,
    now,
    now,
  ));
  for (const batch of chunks(statements, 80)) await db.batch(batch);
}

export async function sourceItemCanonicalUrls(db: D1Database, sourceId: string): Promise<Set<string>> {
  const result = await db.prepare("SELECT canonical_url FROM items WHERE source_id = ?")
    .bind(sourceId)
    .all<{ canonical_url: string }>();
  return new Set(result.results.map((row) => row.canonical_url));
}

async function persistItems(db: D1Database, items: NormalizedItem[], now: string): Promise<void> {
  const statements = items.map((item) => db.prepare(`
    INSERT INTO items (
      id, item_type, title, summary, url, canonical_url, source_id, provider, author,
      published_at, fetched_at, tags_json, importance_score, trend_score, external_score,
      external_comments, content_hash, raw_metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_id, canonical_url) DO UPDATE SET
      item_type = excluded.item_type,
      title = excluded.title,
      summary = excluded.summary,
      url = excluded.url,
      canonical_url = excluded.canonical_url,
      provider = excluded.provider,
      author = excluded.author,
      published_at = excluded.published_at,
      fetched_at = excluded.fetched_at,
      tags_json = excluded.tags_json,
      importance_score = excluded.importance_score,
      trend_score = excluded.trend_score,
      external_score = excluded.external_score,
      external_comments = excluded.external_comments,
      content_hash = excluded.content_hash,
      raw_metadata_json = excluded.raw_metadata_json,
      updated_at = excluded.updated_at
  `).bind(
    item.id, item.itemType, item.title, item.summary, item.url, item.canonicalUrl, item.sourceId,
    item.provider, item.author, item.publishedAt, item.fetchedAt, JSON.stringify(item.tags),
    item.importanceScore, item.trendScore, item.externalScore, item.externalComments,
    item.contentHash, JSON.stringify(item.metadata), now, now,
  ));
  for (const batch of chunks(statements, 80)) await db.batch(batch);
}

async function persistModels(db: D1Database, models: Model[], now: string): Promise<void> {
  const statements = models.map((model) => db.prepare(`
    INSERT INTO models (
      id, canonical_name, provider, provider_model_id, release_date, model_status, open_weight,
      context_length, input_modalities_json, output_modalities_json, input_price, output_price,
      currency, official_url, metadata_source_url, last_verified_at, raw_metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider, provider_model_id) DO UPDATE SET
      canonical_name = excluded.canonical_name,
      release_date = excluded.release_date,
      model_status = excluded.model_status,
      open_weight = excluded.open_weight,
      context_length = excluded.context_length,
      input_modalities_json = excluded.input_modalities_json,
      output_modalities_json = excluded.output_modalities_json,
      input_price = excluded.input_price,
      output_price = excluded.output_price,
      currency = excluded.currency,
      official_url = excluded.official_url,
      metadata_source_url = excluded.metadata_source_url,
      last_verified_at = excluded.last_verified_at,
      raw_metadata_json = excluded.raw_metadata_json,
      updated_at = excluded.updated_at
  `).bind(
    model.id, model.canonicalName, model.provider, model.providerModelId, model.releaseDate,
    model.modelStatus, model.openWeight ? 1 : 0, model.contextLength,
    JSON.stringify(model.inputModalities), JSON.stringify(model.outputModalities), model.inputPrice,
    model.outputPrice, model.currency, model.officialUrl, model.metadataSourceUrl,
    model.lastVerifiedAt, JSON.stringify(model.metadata), now, now,
  ));
  for (const batch of chunks(statements, 60)) await db.batch(batch);
}

async function persistBenchmarks(db: D1Database, results: BenchmarkResult[], now: string): Promise<void> {
  const statements = results.map((result) => db.prepare(`
    INSERT INTO benchmark_results (
      id, benchmark_slug, benchmark_track, model_name, provider, score, score_unit, agent_name,
      scaffold_name, evaluation_date, snapshot_date, source_url, import_method, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      score = excluded.score,
      score_unit = excluded.score_unit,
      snapshot_date = excluded.snapshot_date,
      source_url = excluded.source_url,
      import_method = excluded.import_method,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `).bind(
    result.id, result.benchmarkSlug, result.benchmarkTrack, result.modelName, result.provider,
    result.score, result.scoreUnit, result.agentName, result.scaffoldName, result.evaluationDate,
    result.snapshotDate, result.sourceUrl, result.importMethod, result.notes, now, now,
  ));
  if (statements.length) await db.batch(statements);
}

async function persistEvents(db: D1Database, events: ImportantEvent[], now: string): Promise<void> {
  const statements = events.map((event) => db.prepare(`
    INSERT INTO events (
      id, title, description, category, provider, starts_at, ends_at, all_day,
      source_url, verified_at, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      category = excluded.category,
      provider = excluded.provider,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      all_day = excluded.all_day,
      source_url = excluded.source_url,
      verified_at = excluded.verified_at,
      status = excluded.status,
      updated_at = excluded.updated_at
  `).bind(
    event.id, event.title, event.description, event.category, event.provider, event.startsAt,
    event.endsAt, event.allDay ? 1 : 0, event.sourceUrl, event.verifiedAt, event.status, now, now,
  ));
  if (statements.length) await db.batch(statements);
}

export async function persistAdapterResult(
  db: D1Database,
  result: AdapterResult & { items: NormalizedItem[] },
  now: string,
): Promise<void> {
  await persistItems(db, result.items, now);
  await persistModels(db, result.models, now);
  await persistBenchmarks(db, result.benchmarks, now);
  await persistEvents(db, result.events, now);
}

export async function recordSourceSuccess(db: D1Database, sourceId: string, now: string): Promise<void> {
  await db.prepare(`
    UPDATE sources SET
      last_success_at = ?, last_attempt_at = ?, last_error = NULL,
      consecutive_failures = 0, updated_at = ?
    WHERE id = ?
  `).bind(now, now, now, sourceId).run();
}

export async function recordSourceFailure(
  db: D1Database,
  sourceId: string,
  now: string,
  error: string,
): Promise<void> {
  await db.prepare(`
    UPDATE sources SET
      last_attempt_at = ?, last_error = ?, consecutive_failures = consecutive_failures + 1,
      updated_at = ?
    WHERE id = ?
  `).bind(now, error.slice(0, 1_000), now, sourceId).run();
}

export async function pruneExpiredData(db: D1Database, now: string): Promise<void> {
  const cutoff = new Date(new Date(now).getTime() - 180 * 86_400_000).toISOString();
  await db.batch([
    db.prepare(`
      UPDATE events SET status = 'archived', updated_at = ?
      WHERE status IN ('confirmed', 'predicted') AND COALESCE(ends_at, starts_at) < ?
    `).bind(now, now),
    db.prepare("DELETE FROM items WHERE published_at < ?").bind(cutoff),
  ]);
}
