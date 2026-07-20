import { ArrowClockwise, GithubLogo, Pulse } from "@phosphor-icons/react";
import { formatCapeTownDate } from "@shared/lib/dates";
import type { DashboardResponse, SourceSummary } from "@shared/schemas/domain";
import { useEffect, useMemo, useRef, useState } from "react";
import { REPOSITORY_URL } from "@/lib/repository";
import { SignalMark } from "./SignalMark";

const NAV_LINKS = [
  ["pulse", "Pulse"],
  ["models", "Models"],
  ["agents", "Agents + skills"],
  ["dates", "Release radar"],
] as const;

function healthLabel(sources: SourceSummary[]): { label: string; tone: string } {
  const enabled = sources.filter((source) => source.enabled);
  const unavailable = enabled.filter((source) => source.status === "unavailable").length;
  const degraded = enabled.filter((source) => source.status === "degraded").length;
  const pending = enabled.filter((source) => source.status === "pending").length;
  if (unavailable) return { label: `${unavailable} down`, tone: "danger" };
  if (degraded) return { label: `${degraded} stale`, tone: "warning" };
  if (pending === enabled.length && enabled.length) return { label: "Sync pending", tone: "pending" };
  return { label: "Sources live", tone: "healthy" };
}

interface HeaderProps {
  meta: DashboardResponse["meta"] | null;
  sources: SourceSummary[];
  onRefresh: () => void;
  refreshing: boolean;
}

export function Header({ meta, sources, onRefresh, refreshing }: HeaderProps) {
  const [compact, setCompact] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const health = useMemo(() => healthLabel(sources), [sources]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!(entry?.isIntersecting ?? true)), { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="header-sentinel" aria-hidden="true" />
      <div className="site-header-slot">
        <header className="site-header" data-compact={compact ? "true" : "false"}>
          <div className="header-island">
            <a className="wordmark" href="#top" aria-label="AI Signal, back to top">
              <span className="wordmark__mark"><SignalMark /></span>
              <span>AI Signal</span>
            </a>
            <nav className="section-nav" aria-label="Primary navigation">
              {NAV_LINKS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
            </nav>
            <div className="header-actions">
              <a className={`source-health source-health--${health.tone}`} href="#sources" aria-label={`${health.label}. View source health.`}>
                <Pulse aria-hidden="true" weight="fill" />
                <span>{health.label}</span>
              </a>
              {REPOSITORY_URL && (
                <a className="icon-button header-github" href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" aria-label="Open AI Signal repository in a new tab">
                  <GithubLogo aria-hidden="true" size={19} />
                </a>
              )}
              <button className="icon-button" type="button" onClick={onRefresh} aria-label="Refresh coding signal" disabled={refreshing}>
                <ArrowClockwise aria-hidden="true" size={19} className={refreshing ? "is-spinning" : undefined} />
              </button>
            </div>
          </div>
          <div className="header-context" aria-hidden={compact ? "true" : undefined}>
            <span>{formatCapeTownDate(new Date())}</span>
            <span>{meta?.lastSuccessfulRefreshAt ? "Updates every three hours" : "Awaiting first verified sync"}</span>
          </div>
        </header>
      </div>
    </>
  );
}
