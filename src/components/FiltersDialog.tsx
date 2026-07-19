import { Funnel, X } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import type { DashboardFilters, DateRange } from "@/lib/filters";
import { DEFAULT_FILTERS } from "@/lib/filters";

interface FiltersDialogProps {
  filters: DashboardFilters;
  providers: string[];
  categories: Array<{ value: string; label: string }>;
  resultCount: number;
  onChange: (filters: DashboardFilters) => void;
}

const DATE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All dates" },
];

export function FiltersDialog({ filters, providers, categories, resultCount, onChange }: FiltersDialogProps) {
  const activeCount = [
    filters.provider,
    filters.category,
    filters.dateRange !== DEFAULT_FILTERS.dateRange,
    filters.openWeightOnly,
    filters.codingFocusedOnly,
    filters.unreadOnly,
    filters.bookmarkedOnly,
  ].filter(Boolean).length;
  const update = <Key extends keyof DashboardFilters>(key: Key, value: DashboardFilters[Key]): void => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="button button--secondary" type="button">
          <Funnel aria-hidden="true" />
          Filters{activeCount ? ` (${activeCount})` : ""}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="filter-dialog" aria-describedby="filter-description">
          <div className="dialog-header">
            <div>
              <Dialog.Title>Filter the signal</Dialog.Title>
              <Dialog.Description id="filter-description">Narrow the dashboard without changing the source data.</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close filters">
              <X aria-hidden="true" size={20} />
            </Dialog.Close>
          </div>
          <div className="filter-fields">
            <label className="field">
              <span>Provider</span>
              <select value={filters.provider} onChange={(event) => update("provider", event.target.value)}>
                <option value="">All providers</option>
                {providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Category</span>
              <select value={filters.category} onChange={(event) => update("category", event.target.value)}>
                <option value="">All categories</option>
                {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Date range</span>
              <select value={filters.dateRange} onChange={(event) => update("dateRange", event.target.value as DateRange)}>
                {DATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <fieldset className="filter-checks">
              <legend>Show only</legend>
              {[
                ["openWeightOnly", "Open-weight items"],
                ["codingFocusedOnly", "Coding-focused items"],
                ["unreadOnly", "Unread items"],
                ["bookmarkedOnly", "Bookmarked items"],
              ].map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={Boolean(filters[key as keyof DashboardFilters])}
                    onChange={(event) => update(key as keyof DashboardFilters, event.target.checked as never)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          </div>
          <div className="filter-footer">
            <button className="text-action" type="button" onClick={() => onChange({ ...DEFAULT_FILTERS, query: filters.query })}>Reset filters</button>
            <Dialog.Close className="button button--primary">Show {resultCount} result{resultCount === 1 ? "" : "s"}</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
