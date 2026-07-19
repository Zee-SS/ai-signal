import {
  ArrowClockwise,
  CaretDown,
  GithubLogo,
  MagnifyingGlass,
  Pulse,
} from "@phosphor-icons/react";
import { formatCapeTownDate, formatCapeTownDateTime } from "@shared/lib/dates";
import type { DashboardResponse, SourceSummary } from "@shared/schemas/domain";
import { useEffect, useMemo, useRef, useState } from "react";
import { REPOSITORY_URL } from "@/lib/repository";

const NAV_LINKS = [
  ["today", "Today"],
  ["trends", "Trends"],
  ["models", "Models"],
  ["coding-tools", "Coding tools"],
  ["benchmarks", "Benchmarks"],
  ["dates", "Dates"],
  ["papers", "Papers"],
] as const;

function healthLabel(sources: SourceSummary[]): { label: string; tone: string } {
  const enabled = sources.filter((source) => source.enabled);
  const unavailable = enabled.filter((source) => source.status === "unavailable").length;
  const degraded = enabled.filter((source) => source.status === "degraded").length;
  const pending = enabled.filter((source) => source.status === "pending").length;
  if (unavailable) return { label: `${unavailable} source${unavailable === 1 ? "" : "s"} unavailable`, tone: "danger" };
  if (degraded) return { label: `${degraded} source${degraded === 1 ? "" : "s"} degraded`, tone: "warning" };
  if (pending === enabled.length && enabled.length) return { label: "Sources awaiting first sync", tone: "pending" };
  return { label: `${enabled.length} sources monitored`, tone: "healthy" };
}

interface HeaderProps {
  meta: DashboardResponse["meta"] | null;
  sources: SourceSummary[];
  query: string;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function Header({ meta, sources, query, onQueryChange, onRefresh, refreshing }: HeaderProps) {
  const [compact, setCompact] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const health = useMemo(() => healthLabel(sources), [sources]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!(entry?.isIntersecting ?? true)), { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const insideField = target?.matches("input, textarea, select, [contenteditable='true']") ?? false;
      if (event.key === "/" && !insideField) {
        event.preventDefault();
        searchRef.current?.focus({ preventScroll: true });
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current && query) {
        onQueryChange("");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onQueryChange, query]);

  const jumpToSection = (value: string): void => {
    if (!value) return;
    document.getElementById(value)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div ref={sentinelRef} className="header-sentinel" aria-hidden="true" />
      <header className="site-header" data-compact={compact ? "true" : "false"}>
        <h1 className="sr-only">AI Signal intelligence dashboard</h1>
        <div className="header-shell">
          <div className="header-main">
            <a className="wordmark" href="#top">
              <span className="wordmark__mark" aria-hidden="true">AI</span>
              <span>AI Signal</span>
            </a>
            <p className="header-description">Your daily view of AI models, coding agents, and benchmarks</p>
            <label className="global-search">
              <MagnifyingGlass aria-hidden="true" size={18} />
              <span className="sr-only">Search all dashboard data</span>
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search models, providers, tools, tags"
                autoComplete="off"
              />
              <kbd>/</kbd>
            </label>
            <div className="header-actions">
              {REPOSITORY_URL ? (
                <a className="icon-button" href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" aria-label="Open AI Signal repository in a new tab">
                  <GithubLogo aria-hidden="true" size={20} />
                </a>
              ) : (
                <button type="button" className="icon-button" disabled title="Set VITE_REPOSITORY_URL after publishing" aria-label="Repository link is not configured">
                  <GithubLogo aria-hidden="true" size={20} />
                </button>
              )}
              <button className="icon-button" type="button" onClick={onRefresh} aria-label="Refresh dashboard" disabled={refreshing}>
                <ArrowClockwise aria-hidden="true" size={20} className={refreshing ? "is-spinning" : undefined} />
              </button>
            </div>
          </div>
          <div className="header-status">
            <span className="cape-date">{formatCapeTownDate(new Date())}</span>
            <span className="status-separator" aria-hidden="true" />
            <span className={`health-indicator health-indicator--${health.tone}`}>
              <Pulse aria-hidden="true" size={16} />
              {health.label}
            </span>
            <span className="status-separator" aria-hidden="true" />
            <span>
              {meta?.lastSuccessfulRefreshAt
                ? `Refreshed ${formatCapeTownDateTime(meta.lastSuccessfulRefreshAt)}`
                : "No successful refresh yet"}
            </span>
          </div>
          <nav className="section-nav" aria-label="Dashboard sections">
            {NAV_LINKS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          </nav>
          <label className="section-jump">
            <span>Jump to section</span>
            <select defaultValue="" onChange={(event) => jumpToSection(event.target.value)}>
              <option value="" disabled>Choose</option>
              {NAV_LINKS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <CaretDown aria-hidden="true" />
          </label>
        </div>
      </header>
    </>
  );
}
