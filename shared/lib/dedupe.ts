import type { NormalizedItem } from "../schemas/domain";
import { normalizeTitle } from "./text";

export function deduplicateItems(items: NormalizedItem[]): NormalizedItem[] {
  const primary = new Map<string, NormalizedItem>();
  const secondary = new Set<string>();

  for (const item of items) {
    const canonicalKey = `${item.sourceSlug}|${item.canonicalUrl}`;
    const publicationDay = item.publishedAt.slice(0, 10);
    const contentKey = [
      item.sourceSlug,
      item.provider ?? "",
      normalizeTitle(item.title),
      publicationDay,
      item.contentHash,
    ].join("|");

    const current = primary.get(canonicalKey);
    if (current) {
      if (item.fetchedAt > current.fetchedAt) primary.set(canonicalKey, item);
      continue;
    }
    if (secondary.has(contentKey)) continue;

    primary.set(canonicalKey, item);
    secondary.add(contentKey);
  }

  return [...primary.values()];
}
