import { describe, expect, it } from "vitest";
import { canonicalizeUrl } from "../../shared/lib/url";

describe("canonicalizeUrl", () => {
  it("removes tracking data while preserving meaningful parameters", () => {
    expect(canonicalizeUrl("HTTPS://Example.COM:443/models/?page=2&utm_source=newsletter&fbclid=abc#pricing"))
      .toBe("https://example.com/models?page=2");
  });

  it("resolves a relative URL against an explicit trusted base", () => {
    expect(canonicalizeUrl("../release/?ref_src=feed", "https://example.com/news/posts/"))
      .toBe("https://example.com/news/release");
  });
});
