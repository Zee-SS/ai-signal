import { ArrowSquareOut, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { formatCapeTownDateTime } from "@shared/lib/dates";
import type { DashboardResponse } from "@shared/schemas/domain";
import { SignalMark } from "@/components/SignalMark";
import { REPOSITORY_URL } from "@/lib/repository";

export function SourceFooter({ data }: { data: DashboardResponse }) {
  const enabled = data.sources.filter((source) => source.enabled);
  const healthy = enabled.filter((source) => source.status === "healthy").length;
  return (
    <footer className="source-footer">
      <div className="source-footer__line">
        <span className="source-footer__brand"><SignalMark /><strong>AI Signal</strong></span>
        <span>{healthy}/{enabled.length} sources healthy</span>
        <span>v{data.meta.version}</span>
        <span>No analytics · no account</span>
        {REPOSITORY_URL && <a className="external-link" href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">Repository <ArrowSquareOut aria-hidden="true" /></a>}
      </div>
      <details id="sources" className="source-details">
        <summary>Source health and methodology</summary>
        <div className="source-details__content">
          <div>
            <h3>Method in 30 seconds</h3>
            <p>Coding quality uses SWE-rebench. Speed uses Artificial Analysis. Agent and skill momentum uses live GitHub metadata. These are separate relative signals, never one objective truth.</p>
            <p>Every automated source is fetched in isolation every three hours. Failed sources keep their last verified D1 data and are marked stale.</p>
          </div>
          <ul className="source-list">
            {enabled.map((source) => (
              <li key={source.id} data-status={source.status}>
                {source.status === "healthy" ? <CheckCircle aria-hidden="true" weight="fill" /> : <WarningCircle aria-hidden="true" weight="fill" />}
                <span><a className="external-link" href={source.homepageUrl} target="_blank" rel="noopener noreferrer">{source.name} <ArrowSquareOut aria-hidden="true" /></a><small>{source.lastSuccessAt ? `Fetched ${formatCapeTownDateTime(source.lastSuccessAt)}` : "Awaiting first sync"}</small></span>
                <b>{source.status}</b>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </footer>
  );
}
