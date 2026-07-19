import { z } from "zod";
import { containsAny } from "../../../shared/lib/text";
import { externalItemSchema } from "../../../shared/schemas/domain";
import { fetchWithPolicy } from "./fetcher";
import { type AdapterContext, type AdapterResult, emptyAdapterResult } from "./types";

const storySchema = z.object({
  id: z.number().int(),
  type: z.string(),
  title: z.string().optional(),
  url: z.url().optional(),
  by: z.string().optional(),
  time: z.number().int(),
  score: z.number().int().nonnegative().optional(),
  descendants: z.number().int().nonnegative().optional(),
  dead: z.boolean().optional(),
  deleted: z.boolean().optional(),
});

async function fetchStory(baseUrl: string, id: number): Promise<z.infer<typeof storySchema> | null> {
  try {
    const response = await fetchWithPolicy(`${baseUrl}/item/${id}.json`, {}, { timeoutMs: 6_000, retries: 1 });
    return storySchema.parse(await response.json());
  } catch {
    return null;
  }
}

export async function hackerNewsAdapter(context: AdapterContext): Promise<AdapterResult> {
  const config = context.source.adapter;
  if (config.type !== "hacker_news") throw new Error("Hacker News adapter received incompatible configuration");
  const response = await fetchWithPolicy(`${config.baseUrl}/newstories.json`, {}, { timeoutMs: 8_000, retries: 2 });
  const ids = z.array(z.number().int()).parse(await response.json()).slice(0, config.storySample);
  const stories: Array<z.infer<typeof storySchema>> = [];

  for (let offset = 0; offset < ids.length; offset += 10) {
    const batch = await Promise.all(ids.slice(offset, offset + 10).map((id) => fetchStory(config.baseUrl, id)));
    stories.push(...batch.filter((story): story is z.infer<typeof storySchema> => story !== null));
  }

  const cutoff = Date.now() - 72 * 3_600_000;
  const items = stories
    .filter((story) => story.type === "story" && !story.dead && !story.deleted && story.title)
    .filter((story) => story.time * 1_000 >= cutoff && containsAny(story.title ?? "", config.terms))
    .slice(0, 20)
    .map((story) => externalItemSchema.parse({
      itemType: "community",
      title: story.title,
      summary: `Community-interest signal: ${story.score ?? 0} points and ${story.descendants ?? 0} comments. Popularity is not evidence that a technical claim is correct.`,
      url: story.url ?? `https://news.ycombinator.com/item?id=${story.id}`,
      sourceSlug: context.source.slug,
      provider: null,
      author: story.by ?? null,
      publishedAt: new Date(story.time * 1_000).toISOString(),
      fetchedAt: context.fetchedAt,
      tags: ["community-interest", "hacker-news"],
      externalScore: story.score ?? 0,
      externalComments: story.descendants ?? 0,
      metadata: { hackerNewsId: story.id, qualitySignal: false },
    }));

  return { ...emptyAdapterResult(), items };
}
