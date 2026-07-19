import { describe, expect, it } from "vitest";
import type { FeedAdapterConfig } from "../../shared/source-config";
import { parseFeedXml, parseSitemapDates } from "../../worker/src/adapters/feed";

const config: FeedAdapterConfig = {
  type: "rss",
  url: "https://provider.example/feed.xml",
  itemType: "announcement",
  provider: "Provider",
  tags: ["provider-announcement"],
};

describe("parseFeedXml", () => {
  it("normalizes RSS and strips source markup", () => {
    const xml = `<?xml version="1.0"?><rss><channel><item>
      <title>Introducing Model X</title>
      <link>https://provider.example/model-x</link>
      <pubDate>Sat, 18 Jul 2026 08:00:00 GMT</pubDate>
      <description><![CDATA[<p>A coding model with tool use.</p>]]></description>
      <author>Research Team</author>
    </item></channel></rss>`;
    const [item] = parseFeedXml(xml, config, "provider-news", "2026-07-19T09:00:00.000Z");
    expect(item).toMatchObject({
      itemType: "model_release",
      title: "Introducing Model X",
      summary: "A coding model with tool use.",
      provider: "Provider",
      author: "Research Team",
    });
  });

  it("normalizes Atom author objects", () => {
    const atom = `<?xml version="1.0"?><feed><entry>
      <title>Agent evaluation</title>
      <link rel="alternate" href="https://arxiv.org/abs/2607.00001" />
      <published>2026-07-18T08:00:00Z</published>
      <summary>Repository-level evaluation.</summary>
      <author><name>A. Researcher</name></author>
    </entry></feed>`;
    const [item] = parseFeedXml(atom, { ...config, type: "atom", itemType: "research" }, "arxiv", "2026-07-19T09:00:00.000Z");
    expect(item?.author).toBe("A. Researcher");
    expect(item?.itemType).toBe("research");
  });

  it("rejects malformed or empty feeds", () => {
    expect(() => parseFeedXml("<rss><broken>", config, "provider-news", "2026-07-19T09:00:00.000Z"))
      .toThrow(/Malformed XML|no RSS items/i);
  });

  it("uses matching official sitemap update dates when RSS entries omit dates", () => {
    const feed = `<?xml version="1.0"?><rss><channel><item><title>Developer update</title><link>https://developers.example/update/</link><description>Verified excerpt</description></item></channel></rss>`;
    const sitemap = `<?xml version="1.0"?><urlset><url><loc>https://developers.example/update/</loc><lastmod>2026-07-16</lastmod></url></urlset>`;
    const dates = parseSitemapDates(sitemap);
    const [item] = parseFeedXml(feed, config, "developer-news", "2026-07-19T12:00:00.000Z", dates);

    expect(item?.publishedAt).toBe("2026-07-16T00:00:00.000Z");
    expect(item?.metadata.dateSource).toBe("official-sitemap-lastmod");
  });
});
