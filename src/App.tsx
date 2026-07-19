import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { filterModels } from "@shared/lib/model-filter";
import { type ApiItem, dashboardResponseSchema } from "@shared/schemas/domain";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { FiltersDialog } from "@/components/FiltersDialog";
import { Header } from "@/components/Header";
import { ItemDialog } from "@/components/ItemDialog";
import { BenchmarkSection } from "@/features/dashboard/BenchmarkSection";
import { CodingToolsSection } from "@/features/dashboard/CodingToolsSection";
import { EventsSection } from "@/features/dashboard/EventsSection";
import { MethodologySection } from "@/features/dashboard/MethodologySection";
import { ModelsSection } from "@/features/dashboard/ModelsSection";
import { PapersSection } from "@/features/dashboard/PapersSection";
import { SearchResults } from "@/features/dashboard/SearchResults";
import { SinceLastVisit } from "@/features/dashboard/SinceLastVisit";
import { TodaySignal } from "@/features/dashboard/TodaySignal";
import { TrendRadar } from "@/features/dashboard/TrendRadar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { type DashboardFilters, DEFAULT_FILTERS, filterItems, globalSearch } from "@/lib/filters";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";

const CATEGORIES = [
  ["announcement", "Announcements"],
  ["model_release", "Models"],
  ["coding_tool", "Coding tools"],
  ["benchmark", "Benchmarks"],
  ["research", "Research"],
  ["open_weight_model", "Open weight"],
  ["pricing_change", "Pricing changes"],
  ["deprecation", "Deprecations"],
  ["community", "Community"],
].map(([value, label]) => ({ value: value as string, label: label as string }));

export default function App() {
  const { data, state, error, reload } = useDashboardData();
  const online = useOnlineStatus();
  const [filters, setFilters] = useState<DashboardFilters>(() => ({
    ...DEFAULT_FILTERS,
    ...readStorage<Partial<DashboardFilters>>(STORAGE_KEYS.filters, {}),
    query: "",
  }));
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set(readStorage<string[]>(STORAGE_KEYS.bookmarks, [])));
  const [readItems, setReadItems] = useState<Set<string>>(() => new Set(readStorage<string[]>(STORAGE_KEYS.readItems, [])));
  const [lastVisitAt, setLastVisitAt] = useState<string | null>(() => readStorage<string | null>(STORAGE_KEYS.lastVisit, null));
  const [selectedItem, setSelectedItem] = useState<ApiItem | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  useEffect(() => writeStorage(STORAGE_KEYS.filters, { ...filters, query: "" }), [filters]);
  useEffect(() => writeStorage(STORAGE_KEYS.bookmarks, [...bookmarks]), [bookmarks]);
  useEffect(() => writeStorage(STORAGE_KEYS.readItems, [...readItems]), [readItems]);

  const filteredItems = useMemo(() => data ? filterItems(data.items, filters, bookmarks, readItems) : [], [data, filters, bookmarks, readItems]);
  const modelFilters = useMemo(() => ({
    query: filters.query,
    ...(filters.provider ? { provider: filters.provider } : {}),
    openWeightOnly: filters.openWeightOnly,
    codingFocusedOnly: filters.codingFocusedOnly,
  }), [filters]);
  const filteredModels = useMemo(() => data ? filterModels(data.models, modelFilters) : [], [data, modelFilters]);
  const searchGroups = useMemo(() => data ? globalSearch(data, filters.query) : [], [data, filters.query]);
  const providers = useMemo(() => data
    ? [...new Set([...data.items.map((item) => item.provider), ...data.models.map((model) => model.provider)].filter((value): value is string => Boolean(value)))].sort()
    : [], [data]);

  const toggleBookmark = useCallback((item: ApiItem): void => {
    setBookmarks((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
      return next;
    });
  }, []);

  const toggleRead = (item: ApiItem): void => {
    setReadItems((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
      return next;
    });
  };

  const inspectItem = (item: ApiItem): void => {
    setReadItems((current) => new Set(current).add(item.id));
    setSelectedItem(item);
    setActiveItemId(item.id);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const inField = target?.matches("input, textarea, select, [contenteditable='true']") ?? false;
      if (inField || document.querySelector("[role='dialog']")) return;
      const feed = filteredItems
        .filter((item) => item.itemType !== "community")
        .sort((left, right) => right.importanceScore - left.importanceScore)
        .slice(0, 5);
      if ((event.key === "j" || event.key === "k") && feed.length) {
        event.preventDefault();
        const current = feed.findIndex((item) => item.id === activeItemId);
        const nextIndex = event.key === "j"
          ? current < 0 ? 0 : Math.min(feed.length - 1, current + 1)
          : current < 0 ? feed.length - 1 : Math.max(0, current - 1);
        const next = feed[nextIndex];
        if (next) {
          setActiveItemId(next.id);
          document.querySelector<HTMLElement>(`[data-feed-item="${CSS.escape(next.id)}"]`)?.focus({ preventScroll: true });
          document.querySelector<HTMLElement>(`[data-feed-item="${CSS.escape(next.id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      if (event.key === "b" && activeItemId) {
        const item = feed.find((entry) => entry.id === activeItemId);
        if (item) {
          event.preventDefault();
          toggleBookmark(item);
        }
      }
      if (event.key === "Escape" && filters.query) {
        setFilters((current) => ({ ...current, query: "" }));
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeItemId, filteredItems, filters.query, toggleBookmark]);

  if (!data && state === "loading") {
    return (
      <div id="top">
        <Header meta={null} sources={[]} query={filters.query} onQueryChange={(query) => setFilters((current) => ({ ...current, query }))} onRefresh={reload} refreshing />
        <DashboardSkeleton />
      </div>
    );
  }

  if (!data || !dashboardResponseSchema.safeParse(data).success) {
    return (
      <div id="top">
        <Header meta={null} sources={[]} query={filters.query} onQueryChange={(query) => setFilters((current) => ({ ...current, query }))} onRefresh={reload} refreshing={false} />
        <main id="main-content" className="page-shell error-page">
          <EmptyState
            title="Verified dashboard data is unavailable"
            description={error ?? "D1 and the browser cache did not return a usable dashboard. No fixture data is shown in production."}
            action={<button className="button button--primary" type="button" onClick={reload}><ArrowClockwise aria-hidden="true" /> Try again</button>}
          />
        </main>
      </div>
    );
  }

  const partialFailures = data.sources.filter((source) => source.enabled && ["degraded", "unavailable"].includes(source.status));
  const markAllSeen = (): void => {
    const now = new Date().toISOString();
    setReadItems(new Set(data.items.map((item) => item.id)));
    setLastVisitAt(now);
    writeStorage(STORAGE_KEYS.lastVisit, now);
  };

  return (
    <div id="top">
      <Header
        meta={data.meta}
        sources={data.sources}
        query={filters.query}
        onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
        onRefresh={reload}
        refreshing={state === "loading"}
      />
      <main id="main-content" className="page-shell">
        {(!online || data.meta.fixture || data.meta.isStale || partialFailures.length > 0) && (
          <div className="data-warning" role="status" data-fixture={data.meta.fixture ? "true" : "false"}>
            <WarningCircle aria-hidden="true" weight="fill" />
            <div>
              <strong>{!online ? "Offline mode" : data.meta.fixture ? "Development fixture" : data.meta.isStale ? "Data may be stale" : "Source coverage is partial"}</strong>
              <span>{!online
                ? "Showing the verified dashboard saved on this device. Source links will open when your connection returns."
                : data.meta.staleReason ?? `${partialFailures.length} source${partialFailures.length === 1 ? " could" : "s could"} not be verified in the latest refresh. Other sources remain current.`}</span>
            </div>
          </div>
        )}
        <div className="dashboard-toolbar">
          <span>{filteredItems.length} update{filteredItems.length === 1 ? "" : "s"} in the current view</span>
          <FiltersDialog filters={filters} providers={providers} categories={CATEGORIES} resultCount={filteredItems.length} onChange={setFilters} />
          {JSON.stringify({ ...filters, query: "" }) !== JSON.stringify(DEFAULT_FILTERS) && (
            <button className="text-action" type="button" onClick={() => setFilters({ ...DEFAULT_FILTERS, query: filters.query })}>Reset filters</button>
          )}
        </div>
        <SinceLastVisit data={data} lastVisitAt={lastVisitAt} onMarkAllSeen={markAllSeen} />
        <SearchResults query={filters.query} groups={searchGroups} />
        <TodaySignal
          items={filteredItems}
          bookmarks={bookmarks}
          readItems={readItems}
          activeItemId={activeItemId}
          onBookmark={toggleBookmark}
          onRead={toggleRead}
          onInspect={inspectItem}
          onActivate={(item) => setActiveItemId(item.id)}
        />
        <TrendRadar trends={data.trends} />
        <ModelsSection models={filteredModels} />
        <CodingToolsSection items={filteredItems} />
        <BenchmarkSection benchmarks={data.benchmarks} />
        <EventsSection events={data.events} />
        <PapersSection items={filteredItems} />
        <MethodologySection data={data} />
      </main>
      <ItemDialog
        item={selectedItem}
        bookmarked={selectedItem ? bookmarks.has(selectedItem.id) : false}
        onOpenChange={(open) => { if (!open) setSelectedItem(null); }}
        onBookmark={toggleBookmark}
      />
    </div>
  );
}
