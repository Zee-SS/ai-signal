import { ageInHours } from "@shared/lib/dates";
import type { ApiItem, DashboardResponse } from "@shared/schemas/domain";

export type DateRange = "24h" | "7d" | "30d" | "all";

export interface DashboardFilters {
  query: string;
  provider: string;
  category: string;
  dateRange: DateRange;
  openWeightOnly: boolean;
  codingFocusedOnly: boolean;
  unreadOnly: boolean;
  bookmarkedOnly: boolean;
}

export const DEFAULT_FILTERS: DashboardFilters = {
  query: "",
  provider: "",
  category: "",
  dateRange: "30d",
  openWeightOnly: false,
  codingFocusedOnly: false,
  unreadOnly: false,
  bookmarkedOnly: false,
};

const DATE_HOURS: Record<DateRange, number> = {
  "24h": 24,
  "7d": 168,
  "30d": 720,
  all: Number.POSITIVE_INFINITY,
};

export function filterItems(
  items: ApiItem[],
  filters: DashboardFilters,
  bookmarks: Set<string>,
  readItems: Set<string>,
  now = new Date(),
): ApiItem[] {
  const query = filters.query.trim().toLocaleLowerCase("en");
  return items.filter((item) => {
    const searchable = [item.title, item.summary, item.provider, item.author, item.itemType, ...item.tags]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("en");
    if (query && !searchable.includes(query)) return false;
    if (filters.provider && item.provider !== filters.provider) return false;
    if (filters.category && item.itemType !== filters.category) return false;
    if (ageInHours(item.publishedAt, now) > DATE_HOURS[filters.dateRange]) return false;
    if (filters.openWeightOnly && item.itemType !== "open_weight_model" && !item.tags.includes("open-weight")) return false;
    if (filters.codingFocusedOnly && item.metadata.codingRelevant !== true && !/(code|coding|software|agent|cli)/i.test(searchable)) return false;
    if (filters.unreadOnly && readItems.has(item.id)) return false;
    if (filters.bookmarkedOnly && !bookmarks.has(item.id)) return false;
    return true;
  });
}

export interface SearchGroup {
  label: string;
  count: number;
  entries: Array<{ id: string; title: string; meta: string; href: string }>;
}

export function globalSearch(data: DashboardResponse, query: string): SearchGroup[] {
  const needle = query.trim().toLocaleLowerCase("en");
  if (!needle) return [];
  const includes = (...values: Array<string | null | undefined>): boolean => values.join(" ").toLocaleLowerCase("en").includes(needle);
  const groups: SearchGroup[] = [
    {
      label: "Updates",
      entries: data.items.filter((item) => includes(item.title, item.summary, item.provider, item.tags.join(" ")))
        .slice(0, 8).map((item) => ({ id: item.id, title: item.title, meta: item.source.name, href: item.url })),
      count: 0,
    },
    {
      label: "Models",
      entries: data.models.filter((model) => includes(model.canonicalName, model.provider, model.providerModelId))
        .slice(0, 8).map((model) => ({ id: model.id, title: model.canonicalName, meta: model.provider, href: model.officialUrl ?? model.metadataSourceUrl })),
      count: 0,
    },
    {
      label: "Benchmarks",
      entries: data.benchmarks.filter((benchmark) => includes(benchmark.name, benchmark.description))
        .map((benchmark) => ({ id: benchmark.slug, title: benchmark.name, meta: "Benchmark", href: benchmark.leaderboardUrl })),
      count: 0,
    },
    {
      label: "Important dates",
      entries: data.events.filter((event) => includes(event.title, event.description, event.provider))
        .map((event) => ({ id: event.id, title: event.title, meta: event.provider ?? event.category, href: event.sourceUrl })),
      count: 0,
    },
  ];
  return groups.map((group) => ({ ...group, count: group.entries.length })).filter((group) => group.count > 0);
}
