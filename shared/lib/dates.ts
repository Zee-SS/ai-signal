export const DEFAULT_TIMEZONE = "Africa/Johannesburg" as const;

export function formatCapeTownDate(value: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: DEFAULT_TIMEZONE,
  }).formatToParts(typeof value === "string" ? new Date(value) : value);
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("day")} ${part("month")} ${part("year")}`;
}

export function formatCapeTownDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: DEFAULT_TIMEZONE,
    timeZoneName: "short",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function countdownLabel(startsAt: string, now = new Date()): string {
  const delta = new Date(startsAt).getTime() - now.getTime();
  const days = Math.ceil(delta / 86_400_000);
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

export function ageInHours(publishedAt: string, now = new Date()): number {
  return Math.max(0, (now.getTime() - new Date(publishedAt).getTime()) / 3_600_000);
}
