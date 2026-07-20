import { ArrowSquareOut, Check, Clock, Lightning, Medal, PiggyBank } from "@phosphor-icons/react";
import { formatCapeTownDate, formatCapeTownDateTime } from "@shared/lib/dates";
import type { ApiItem, CodingModelSignal, DashboardResponse } from "@shared/schemas/domain";

interface DailyPulseProps {
  data: DashboardResponse;
  lastVisitAt: string | null;
  onMarkSeen: () => void;
}

function latestAgentRelease(items: ApiItem[]): ApiItem | null {
  return [...items]
    .filter((item) => item.itemType === "coding_tool" && !item.tags.includes("github-activity"))
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))[0] ?? null;
}

function bestValue(models: CodingModelSignal[]): CodingModelSignal | null {
  return [...models].sort((left, right) => (right.qualityScore / Math.max(right.costPerProblem, 0.01)) - (left.qualityScore / Math.max(left.costPerProblem, 0.01)))[0] ?? null;
}

export function DailyPulse({ data, lastVisitAt, onMarkSeen }: DailyPulseProps) {
  const models = data.codingModels;
  const leader = [...models].sort((left, right) => left.qualityRank - right.qualityRank)[0] ?? null;
  const fastest = [...models].sort((left, right) => right.speedTokensPerSecond - left.speedTokensPerSecond)[0] ?? null;
  const value = bestValue(models);
  const release = latestAgentRelease(data.items);
  const newCount = lastVisitAt
    ? data.items.filter((item) => item.publishedAt > lastVisitAt && (item.itemType === "coding_tool" || item.itemType === "model_release" || item.tags.includes("coding-agent"))).length
    : data.items.filter((item) => item.itemType === "coding_tool" || item.itemType === "model_release").length;

  return (
    <section className="pulse-section" aria-labelledby="pulse-heading">
      <div className="pulse-intro">
        <div>
          <p className="eyebrow"><span className="live-dot" /> Daily coding pulse</p>
          <h1 id="pulse-heading">The coding edge,<br /><span>without the noise.</span></h1>
        </div>
        <div className="pulse-intro__aside">
          <p>Quality, speed, agents, and release movement. Five minutes, once a day.</p>
          <div className="visit-note">
            <span><strong>{newCount}</strong> new coding signal{newCount === 1 ? "" : "s"} since your last check</span>
            <button type="button" className="text-button" onClick={onMarkSeen}><Check aria-hidden="true" /> Mark seen</button>
          </div>
        </div>
      </div>

      <div className="decision-grid">
        {leader && (
          <article className="decision-card decision-card--leader">
            <div className="decision-card__icon"><Medal aria-hidden="true" weight="duotone" /></div>
            <p>Quality leader</p>
            <strong>{leader.model}</strong>
            <div className="decision-card__metric"><b>{leader.qualityScore}%</b><span>SWE-rebench resolved</span></div>
            <a href={leader.qualitySourceUrl} target="_blank" rel="noopener noreferrer">Leaderboard <ArrowSquareOut aria-hidden="true" /></a>
          </article>
        )}
        {fastest && (
          <article className="decision-card">
            <div className="decision-card__icon"><Lightning aria-hidden="true" weight="duotone" /></div>
            <p>Fastest in cohort</p>
            <strong>{fastest.model}</strong>
            <div className="decision-card__metric"><b>{fastest.speedTokensPerSecond}</b><span>output tok/s</span></div>
            <a href={fastest.speedSourceUrl} target="_blank" rel="noopener noreferrer">Speed source <ArrowSquareOut aria-hidden="true" /></a>
          </article>
        )}
        {value && (
          <article className="decision-card">
            <div className="decision-card__icon"><PiggyBank aria-hidden="true" weight="duotone" /></div>
            <p>Value trade-off</p>
            <strong>{value.model}</strong>
            <div className="decision-card__metric"><b>${value.costPerProblem.toFixed(2)}</b><span>per benchmark problem</span></div>
            <a href={value.qualitySourceUrl} target="_blank" rel="noopener noreferrer">Run data <ArrowSquareOut aria-hidden="true" /></a>
          </article>
        )}
        <article className="decision-card decision-card--release">
          <div className="decision-card__icon"><Clock aria-hidden="true" weight="duotone" /></div>
          <p>Latest agent release</p>
          {release ? (
            <>
              <strong>{release.title}</strong>
              <div className="decision-card__metric"><b>{formatCapeTownDate(release.publishedAt)}</b><span>{release.provider ?? release.source.name}</span></div>
              <a href={release.url} target="_blank" rel="noopener noreferrer">Release notes <ArrowSquareOut aria-hidden="true" /></a>
            </>
          ) : (
            <><strong>No verified release yet</strong><span className="muted">The next sync will keep checking official repositories.</span></>
          )}
        </article>
      </div>

      <p className="freshness-line">
        {data.meta.lastSuccessfulRefreshAt ? `Fetched ${formatCapeTownDateTime(data.meta.lastSuccessfulRefreshAt)}` : "No successful production refresh yet"}
        <span>·</span>
        Model measurements verified {models[0] ? formatCapeTownDate(models[0].snapshotDate) : "not available"}
      </p>
    </section>
  );
}
