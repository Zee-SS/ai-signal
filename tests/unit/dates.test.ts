import { describe, expect, it } from "vitest";
import { countdownLabel, formatCapeTownDate } from "../../shared/lib/dates";

describe("Cape Town dates", () => {
  it("renders the calendar date in Africa/Johannesburg", () => {
    expect(formatCapeTownDate("2026-07-18T22:30:00.000Z")).toBe("19 Jul 2026");
  });

  it("formats useful countdown labels", () => {
    const now = new Date("2026-07-19T10:00:00.000Z");
    expect(countdownLabel("2026-07-20T09:00:00.000Z", now)).toBe("Tomorrow");
    expect(countdownLabel("2026-07-24T10:00:00.000Z", now)).toBe("5 days");
  });
});
