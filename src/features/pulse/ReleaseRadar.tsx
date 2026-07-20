import { ArrowSquareOut, CalendarBlank, DownloadSimple } from "@phosphor-icons/react";
import { countdownLabel, formatCapeTownDate } from "@shared/lib/dates";
import type { ImportantEvent } from "@shared/schemas/domain";
import { downloadEventIcs } from "@/lib/ics";

const RELEASE_CATEGORY = /(model|agent|tool|release|launch)/i;

export function ReleaseRadar({ events }: { events: ImportantEvent[] }) {
  const upcoming = events.filter((event) =>
    (event.status === "confirmed" || event.status === "predicted")
    && new Date(event.endsAt ?? event.startsAt).getTime() >= Date.now()
    && RELEASE_CATEGORY.test(event.category),
  );
  return (
    <section className="release-section" aria-labelledby="dates-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Release radar</p>
          <h2 id="dates-heading">Only dates worth watching.</h2>
          <p>Confirmed launches and source-backed predictions for models, agents, and important coding tools. No broad event calendar.</p>
        </div>
      </div>
      {upcoming.length ? (
        <ol className="release-timeline">
          {upcoming.map((event) => (
            <li key={event.id}>
              <time dateTime={event.startsAt}><strong>{formatCapeTownDate(event.startsAt)}</strong><span>{countdownLabel(event.startsAt)}</span></time>
              <span className={`confidence-tag confidence-tag--${event.status}`}>{event.status}</span>
              <div><strong>{event.title}</strong>{event.description && <p>{event.description}</p>}<small>{event.provider ?? event.category} · verified {formatCapeTownDate(event.verifiedAt)}</small></div>
              <div className="release-actions">
                <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open source for ${event.title}`}><ArrowSquareOut aria-hidden="true" /></a>
                <button type="button" onClick={() => downloadEventIcs(event)} aria-label={`Download ${event.title} calendar file`}><DownloadSimple aria-hidden="true" /></button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="release-empty"><CalendarBlank aria-hidden="true" weight="duotone" /><div><strong>No verified coding releases on the calendar.</strong><p>That is a real empty state, not missing fixture data. The source adapters will add a date only when an original source gives one.</p></div></div>
      )}
    </section>
  );
}
