import { ArrowSquareOut, CheckCircle, Clock, GithubLogo, WarningCircle, XCircle } from "@phosphor-icons/react";
import { formatCapeTownDateTime } from "@shared/lib/dates";
import type { DashboardResponse, SourceSummary } from "@shared/schemas/domain";
import { REPOSITORY_URL } from "@/lib/repository";

function StatusIcon({ status }: { status: SourceSummary["status"] }) {
  if (status === "healthy") return <CheckCircle aria-hidden="true" weight="fill" />;
  if (status === "unavailable") return <XCircle aria-hidden="true" weight="fill" />;
  if (status === "degraded") return <WarningCircle aria-hidden="true" weight="fill" />;
  return <Clock aria-hidden="true" weight="fill" />;
}

export function MethodologySection({ data }: { data: DashboardResponse }) {
  const enabled = data.sources.filter((source) => source.enabled);
  const groups = enabled.reduce<Map<string, SourceSummary[]>>((map, source) => {
    const label = source.sourceType.replaceAll("_", " ");
    map.set(label, [...(map.get(label) ?? []), source]);
    return map;
  }, new Map());
  return (
    <section id="methodology" className="dashboard-section methodology-section" aria-labelledby="methodology-heading">
      <div className="section-heading">
        <div>
          <h2 id="methodology-heading">Source health and methodology</h2>
          <p>What AI Signal knows, when it checked, and how the ranking is calculated.</p>
        </div>
      </div>
      <div className="methodology-layout">
        <div className="source-health-panel">
          <div className="panel-heading"><h3>Enabled sources</h3><span>{enabled.length} configured</span></div>
          <div className="source-groups">
            {[...groups.entries()].map(([label, sources]) => (
              <div className="source-group" key={label}>
                <h4>{label}</h4>
                {sources.map((source) => (
                  <div className="source-health-row" key={source.id} data-status={source.status}>
                    <StatusIcon status={source.status} />
                    <div>
                      <a href={source.homepageUrl} target="_blank" rel="noopener noreferrer">
                        {source.name}<ArrowSquareOut aria-hidden="true" />
                      </a>
                      <span>{source.lastSuccessAt ? `Fetched ${formatCapeTownDateTime(source.lastSuccessAt)}` : "Awaiting first successful fetch"}</span>
                      {source.lastError && <small>{source.lastError}</small>}
                    </div>
                    <strong>{source.status}</strong>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="methodology-copy">
          <div>
            <h3>Importance ranking</h3>
            <p>Deterministic weights consider official sourcing, confirmed releases, coding relevance, breaking changes, benchmark updates, price or context changes, recency, and corroboration.</p>
          </div>
          <div>
            <h3>Trend ranking</h3>
            <p>Recent mention count, source diversity, trust weighting, recency decay, and Hacker News engagement contribute. Community engagement is labelled as popularity, never correctness.</p>
          </div>
          <div>
            <h3>Freshness</h3>
            <p>Sources refresh every three hours. Failed sources retain their last D1 data. Responses more than six hours past the last successful fetch are visibly marked stale.</p>
          </div>
          <div>
            <h3>Privacy</h3>
            <p>No account, analytics, or personal-data collection. Bookmarks, read state, filters, and visit history stay in this browser’s local storage.</p>
          </div>
          {REPOSITORY_URL ? (
            <a className="button button--secondary" href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
              <GithubLogo aria-hidden="true" />
              View repository
            </a>
          ) : (
            <span className="button button--secondary" aria-disabled="true" title="Set VITE_REPOSITORY_URL after publishing">
              <GithubLogo aria-hidden="true" />
              Repository link pending
            </span>
          )}
        </div>
      </div>
      <footer className="application-footer">
        <p>AI Signal {data.meta.version}. Source excerpts remain with their publishers. Full articles are never copied. Dates render in Africa/Johannesburg.</p>
        <div>
          <span>React + Cloudflare Pages, Workers, and D1</span>
          {REPOSITORY_URL
            ? <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">Repository <ArrowSquareOut aria-hidden="true" /></a>
            : <span>Repository link pending</span>}
        </div>
      </footer>
    </section>
  );
}
