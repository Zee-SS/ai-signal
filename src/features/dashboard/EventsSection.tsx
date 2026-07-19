import { ArrowSquareOut, CalendarPlus, DownloadSimple } from "@phosphor-icons/react";
import { countdownLabel, formatCapeTownDate } from "@shared/lib/dates";
import type { ImportantEvent } from "@shared/schemas/domain";
import { EmptyState } from "@/components/EmptyState";
import { downloadEventIcs } from "@/lib/ics";

function monthKey(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric", timeZone: "Africa/Johannesburg" }).format(new Date(value));
}

export function EventsSection({ events }: { events: ImportantEvent[] }) {
  const future = events.filter((event) => event.status === "confirmed" && new Date(event.endsAt ?? event.startsAt).getTime() >= Date.now());
  const grouped = future.reduce<Map<string, ImportantEvent[]>>((map, event) => {
    const key = monthKey(event.startsAt);
    map.set(key, [...(map.get(key) ?? []), event]);
    return map;
  }, new Map());
  return (
    <section id="dates" className="dashboard-section events-section" aria-labelledby="dates-heading">
      <div className="section-heading">
        <div>
          <h2 id="dates-heading">Important dates</h2>
          <p>Confirmed deadlines, deprecations, events, and shutdowns in Cape Town local time. Rumours are excluded.</p>
        </div>
      </div>
      {grouped.size ? (
        <div className="timeline">
          {[...grouped.entries()].map(([month, monthEvents]) => (
            <div className="timeline-group" key={month}>
              <h3>{month}</h3>
              <div className="timeline-group__events">
                {monthEvents.map((event) => (
                  <article className="timeline-event" key={event.id}>
                    <div className="timeline-event__date">
                      <time dateTime={event.startsAt}>{formatCapeTownDate(event.startsAt)}</time>
                      <span>{countdownLabel(event.startsAt)}</span>
                    </div>
                    <div className="timeline-event__body">
                      <span className="type-label">{event.category}</span>
                      <h4>{event.title}</h4>
                      {event.description && <p>{event.description}</p>}
                      <div className="timeline-event__meta">
                        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link">
                          Verified source <ArrowSquareOut aria-hidden="true" />
                        </a>
                        <span>Verified {formatCapeTownDate(event.verifiedAt)}</span>
                      </div>
                    </div>
                    <button className="button button--secondary" type="button" onClick={() => downloadEventIcs(event)}>
                      <DownloadSimple aria-hidden="true" />
                      Add to calendar
                    </button>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No verified future dates"
          description="No current event seed has a confirmed future date. Expired events are archived automatically."
          action={<CalendarPlus aria-hidden="true" size={20} />}
        />
      )}
    </section>
  );
}
