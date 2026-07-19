import { Check, ClockCounterClockwise } from "@phosphor-icons/react";
import { formatCapeTownDateTime } from "@shared/lib/dates";
import type { DashboardResponse } from "@shared/schemas/domain";

interface SinceLastVisitProps {
  data: DashboardResponse;
  lastVisitAt: string | null;
  onMarkAllSeen: () => void;
}

export function SinceLastVisit({ data, lastVisitAt, onMarkAllSeen }: SinceLastVisitProps) {
  const lastVisit = lastVisitAt ? new Date(lastVisitAt).getTime() : Date.now() - 72 * 3_600_000;
  const isNew = (date: string): boolean => new Date(date).getTime() > lastVisit;
  const newModels = data.models.filter((model) => model.releaseDate && isNew(`${model.releaseDate}T23:59:59.999Z`)).length;
  const toolReleases = data.items.filter((item) => item.itemType === "coding_tool" && isNew(item.publishedAt)).length;
  const benchmarkUpdates = data.benchmarks.filter((benchmark) => benchmark.lastSnapshotAt && isNew(`${benchmark.lastSnapshotAt}T23:59:59.999Z`)).length;
  const announcements = data.items.filter((item) => ["announcement", "model_release", "deprecation", "pricing_change"].includes(item.itemType) && isNew(item.publishedAt)).length;

  return (
    <section className="since-visit" aria-labelledby="since-visit-heading">
      <div className="since-visit__intro">
        <ClockCounterClockwise aria-hidden="true" size={22} />
        <div>
          <h2 id="since-visit-heading">Since your last visit</h2>
          <p>{lastVisitAt ? `Last seen ${formatCapeTownDateTime(lastVisitAt)}` : "This browser has no previous successful visit."}</p>
        </div>
      </div>
      <dl className="since-visit__counts">
        <div><dd>{newModels}</dd><dt>new models</dt></div>
        <div><dd>{toolReleases}</dd><dt>coding-tool releases</dt></div>
        <div><dd>{benchmarkUpdates}</dd><dt>benchmark snapshots</dt></div>
        <div><dd>{announcements}</dd><dt>important announcements</dt></div>
      </dl>
      <button className="button button--quiet" type="button" onClick={onMarkAllSeen}>
        <Check aria-hidden="true" />
        Mark all as seen
      </button>
    </section>
  );
}
