PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  homepage_url TEXT NOT NULL,
  feed_url TEXT,
  trust_tier INTEGER NOT NULL DEFAULT 2 CHECK (trust_tier BETWEEN 0 AND 3),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  last_success_at TEXT,
  last_attempt_at TEXT,
  last_error TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  provider TEXT,
  author TEXT,
  published_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  importance_score REAL NOT NULL DEFAULT 0 CHECK (importance_score BETWEEN 0 AND 100),
  trend_score REAL NOT NULL DEFAULT 0 CHECK (trend_score BETWEEN 0 AND 100),
  external_score REAL,
  external_comments INTEGER,
  content_hash TEXT NOT NULL,
  raw_metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source_id, content_hash)
);

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_model_id TEXT NOT NULL,
  release_date TEXT,
  model_status TEXT NOT NULL,
  open_weight INTEGER NOT NULL DEFAULT 0 CHECK (open_weight IN (0, 1)),
  context_length INTEGER,
  input_modalities_json TEXT NOT NULL DEFAULT '[]',
  output_modalities_json TEXT NOT NULL DEFAULT '[]',
  input_price REAL,
  output_price REAL,
  currency TEXT,
  official_url TEXT,
  metadata_source_url TEXT NOT NULL,
  last_verified_at TEXT NOT NULL,
  raw_metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(provider, provider_model_id)
);

CREATE TABLE IF NOT EXISTS benchmark_results (
  id TEXT PRIMARY KEY,
  benchmark_slug TEXT NOT NULL,
  benchmark_track TEXT NOT NULL,
  model_name TEXT NOT NULL,
  provider TEXT,
  score REAL NOT NULL,
  score_unit TEXT NOT NULL,
  agent_name TEXT,
  scaffold_name TEXT,
  evaluation_date TEXT NOT NULL,
  snapshot_date TEXT NOT NULL,
  source_url TEXT NOT NULL,
  import_method TEXT NOT NULL CHECK (import_method IN ('automatic', 'manual')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(benchmark_slug, benchmark_track, model_name, evaluation_date, agent_name, scaffold_name)
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  provider TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  all_day INTEGER NOT NULL DEFAULT 1 CHECK (all_day IN (0, 1)),
  source_url TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(title, starts_at, source_url)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL,
  sources_attempted INTEGER NOT NULL DEFAULT 0,
  sources_succeeded INTEGER NOT NULL DEFAULT 0,
  items_inserted INTEGER NOT NULL DEFAULT 0,
  items_updated INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT,
  duration_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_published_at ON items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_type_published ON items(item_type, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_provider_published ON items(provider, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_importance ON items(importance_score DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_trend ON items(trend_score DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_canonical_url ON items(canonical_url);
CREATE INDEX IF NOT EXISTS idx_models_release_date ON models(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider, release_date DESC);
CREATE INDEX IF NOT EXISTS idx_benchmarks_slug_track ON benchmark_results(benchmark_slug, benchmark_track, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_sources_health ON sources(enabled, consecutive_failures, last_success_at);
CREATE INDEX IF NOT EXISTS idx_sync_runs_started ON sync_runs(started_at DESC);
