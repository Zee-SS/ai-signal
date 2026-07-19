import { describe, expect, it } from "vitest";
import { stripMarkdown } from "../../shared/lib/text";

describe("stripMarkdown", () => {
  it("turns release-note Markdown into a safe compact excerpt", () => {
    expect(stripMarkdown("## What's changed\n- Added `screenReader` mode\n- See [documentation](https://example.com/docs)"))
      .toBe("What's changed Added screenReader mode See documentation");
  });

  it("drops fenced code blocks instead of copying them into cards", () => {
    expect(stripMarkdown("Fixes setup.\n```sh\nrm -rf example\n```\nSee source."))
      .toBe("Fixes setup. See source.");
  });
});
