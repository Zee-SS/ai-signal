import type { ImportantEvent } from "@shared/schemas/domain";

const escapeIcs = (value: string): string => value
  .replaceAll("\\", "\\\\")
  .replaceAll(";", "\\;")
  .replaceAll(",", "\\,")
  .replaceAll(/\r?\n/g, "\\n");

const toUtcStamp = (value: string): string => new Date(value)
  .toISOString()
  .replaceAll(/[-:]/g, "")
  .replace(/\.\d{3}Z$/, "Z");

const toAllDay = (value: string): string => value.slice(0, 10).replaceAll("-", "");

export function eventToIcs(event: ImportantEvent): string {
  const start = event.allDay
    ? `DTSTART;VALUE=DATE:${toAllDay(event.startsAt)}`
    : `DTSTART:${toUtcStamp(event.startsAt)}`;
  const end = event.endsAt
    ? event.allDay
      ? `\r\nDTEND;VALUE=DATE:${toAllDay(event.endsAt)}`
      : `\r\nDTEND:${toUtcStamp(event.endsAt)}`
    : "";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Signal//Important Dates//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(event.id)}@ai-signal`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `${start}${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description ?? "Verified date from AI Signal")}`,
    `URL:${escapeIcs(event.sourceUrl)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadEventIcs(event: ImportantEvent): void {
  const blob = new Blob([eventToIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.title.toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ai-signal-event"}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}
