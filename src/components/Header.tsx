import { ArrowClockwise, GithubLogo, Moon, Pulse, Sun } from "@phosphor-icons/react";
import { formatCapeTownDate } from "@shared/lib/dates";
import type { DashboardResponse, SourceSummary } from "@shared/schemas/domain";
import { useEffect, useMemo, useRef, useState } from "react";
import { reloadPageFromTop } from "@/lib/page-scroll";
import { REPOSITORY_URL } from "@/lib/repository";
import { applyTheme, currentTheme, type Theme } from "@/lib/theme";
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
}

export function Header({ meta, sources }: HeaderProps) {
  const [compact, setCompact] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => currentTheme());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const health = useMemo(() => healthLabel(sources), [sources]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!(entry?.isIntersecting ?? true)), { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const toggleTheme = (): void => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    applyTheme(nextTheme, true);
    setTheme(nextTheme);
  };

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
              <button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} aria-pressed={theme === "dark"} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
                <span className="theme-toggle__icon" data-theme={theme}>{theme === "light" ? <Moon aria-hidden="true" size={19} weight="fill" /> : <Sun aria-hidden="true" size={19} weight="fill" />}</span>
              </button>
              {REPOSITORY_URL && (
                <a className="icon-button header-github" href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" aria-label="Open AI Signal repository in a new tab">
                  <GithubLogo aria-hidden="true" size={19} />
                </a>
              )}
              <button className="icon-button" type="button" onClick={reloadPageFromTop} aria-label="Reload AI Signal from the top" title="Reload AI Signal from the top">
                <ArrowClockwise aria-hidden="true" size={19} />
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
