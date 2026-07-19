import { deduplicateItems } from "../../../shared/lib/dedupe";
import { ENABLED_SOURCES } from "../../../shared/source-config";
import type { CloudflareEnv } from "../../../shared/types/bindings";
import { getAdapter } from "../adapters";
import {
  persistAdapterResult,
  pruneExpiredData,
  recordSourceFailure,
  recordSourceSuccess,
  sourceItemCanonicalUrls,
  syncSourceDefinitions,
} from "./database";
import { normalizeExternalItems } from "./normalize";

export interface IngestionSummary {
  id: string;
  status: "success" | "partial" | "failed";
  sourcesAttempted: number;
  sourcesSucceeded: number;
  itemsInserted: number;
  itemsUpdated: number;
  errors: Array<{ source: string; message: string }>;
  durationMs: number;
}

export async function runIngestion(env: CloudflareEnv): Promise<IngestionSummary> {
  const started = performance.now();
  const startedAt = new Date().toISOString();
  const syncId = crypto.randomUUID();
  await syncSourceDefinitions(env.AI_SIGNAL_DB, startedAt);
  await env.AI_SIGNAL_DB.prepare(`
    INSERT INTO sync_runs (id, started_at, status, created_at)
    VALUES (?, ?, 'running', ?)
  `).bind(syncId, startedAt, startedAt).run();

  let sourcesSucceeded = 0;
  let itemsInserted = 0;
  let itemsUpdated = 0;
  const errors: Array<{ source: string; message: string }> = [];

  for (const source of ENABLED_SOURCES) {
    const fetchedAt = new Date().toISOString();
    try {
      console.info(JSON.stringify({ event: "source_sync_started", source: source.slug, at: fetchedAt }));
      const result = await getAdapter(source.adapter.type)({ source, env, fetchedAt });
      const normalized = deduplicateItems(await normalizeExternalItems(result.items, source, new Date(fetchedAt)));
      const existingUrls = await sourceItemCanonicalUrls(env.AI_SIGNAL_DB, source.id);
      itemsInserted += normalized.filter((item) => !existingUrls.has(item.canonicalUrl)).length;
      itemsUpdated += normalized.filter((item) => existingUrls.has(item.canonicalUrl)).length;

      await persistAdapterResult(env.AI_SIGNAL_DB, { ...result, items: normalized }, fetchedAt);
      await recordSourceSuccess(env.AI_SIGNAL_DB, source.id, fetchedAt);
      sourcesSucceeded += 1;
      console.info(JSON.stringify({
        event: "source_sync_succeeded",
        source: source.slug,
        items: normalized.length,
        models: result.models.length,
        at: fetchedAt,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown adapter failure";
      errors.push({ source: source.slug, message });
      try {
        await recordSourceFailure(env.AI_SIGNAL_DB, source.id, fetchedAt, message);
      } catch (healthError) {
        console.error(JSON.stringify({
          event: "source_health_write_failed",
          source: source.slug,
          message: healthError instanceof Error ? healthError.message : "Unknown D1 failure",
        }));
      }
      console.error(JSON.stringify({ event: "source_sync_failed", source: source.slug, message, at: fetchedAt }));
    }
  }

  try {
    await pruneExpiredData(env.AI_SIGNAL_DB, new Date().toISOString());
  } catch (error) {
    console.error(JSON.stringify({
      event: "retention_cleanup_failed",
      message: error instanceof Error ? error.message : "Unknown D1 failure",
    }));
  }

  const completedAt = new Date().toISOString();
  const durationMs = Math.round(performance.now() - started);
  const status = sourcesSucceeded === ENABLED_SOURCES.length
    ? "success"
    : sourcesSucceeded > 0
      ? "partial"
      : "failed";
  const errorSummary = errors.length ? JSON.stringify(errors) : null;
  await env.AI_SIGNAL_DB.prepare(`
    UPDATE sync_runs SET
      completed_at = ?, status = ?, sources_attempted = ?, sources_succeeded = ?,
      items_inserted = ?, items_updated = ?, error_summary = ?, duration_ms = ?
    WHERE id = ?
  `).bind(
    completedAt, status, ENABLED_SOURCES.length, sourcesSucceeded, itemsInserted,
    itemsUpdated, errorSummary, durationMs, syncId,
  ).run();

  const summary: IngestionSummary = {
    id: syncId,
    status,
    sourcesAttempted: ENABLED_SOURCES.length,
    sourcesSucceeded,
    itemsInserted,
    itemsUpdated,
    errors,
    durationMs,
  };
  console.info(JSON.stringify({ event: "sync_completed", ...summary }));
  return summary;
}
