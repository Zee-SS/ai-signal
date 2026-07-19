-- A source item is identified by its canonical URL. Excerpts and metadata may
-- change between fetches without creating duplicate dashboard entries.
DELETE FROM items
WHERE EXISTS (
  SELECT 1
  FROM items AS newer
  WHERE newer.source_id = items.source_id
    AND newer.canonical_url = items.canonical_url
    AND (
      newer.fetched_at > items.fetched_at
      OR (newer.fetched_at = items.fetched_at AND newer.rowid > items.rowid)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_source_canonical_unique
  ON items(source_id, canonical_url);
