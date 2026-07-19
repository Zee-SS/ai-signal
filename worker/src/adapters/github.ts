import { z } from "zod";
import { stripMarkdown, truncate } from "../../../shared/lib/text";
import { externalItemSchema } from "../../../shared/schemas/domain";
import { fetchWithPolicy } from "./fetcher";
import { type AdapterContext, type AdapterResult, emptyAdapterResult } from "./types";

const releaseSchema = z.object({
  id: z.number(),
  html_url: z.url(),
  tag_name: z.string(),
  name: z.string().nullable(),
  body: z.string().nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  published_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  author: z.object({ login: z.string() }).nullable(),
});

const releasesSchema = z.array(releaseSchema);

export async function githubReleasesAdapter(context: AdapterContext): Promise<AdapterResult> {
  const config = context.source.adapter;
  if (config.type !== "github_releases") throw new Error("GitHub adapter received incompatible configuration");

  const headers: HeadersInit = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (context.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${context.env.GITHUB_TOKEN}`;
  const url = `https://api.github.com/repos/${config.repository}/releases?per_page=12`;
  const response = await fetchWithPolicy(url, { headers }, { timeoutMs: 12_000, retries: 2 });
  const releases = releasesSchema.parse(await response.json());
  const includePrereleases = context.env.INCLUDE_PRERELEASES === "true";

  const items = releases
    .filter((release) => !release.draft && (includePrereleases || !release.prerelease))
    .map((release) => {
      const version = release.name?.trim() || release.tag_name;
      const body = release.body ?? "";
      return externalItemSchema.parse({
        itemType: "coding_tool",
        title: `${config.repository.split("/")[1]} ${version}`,
        summary: truncate(stripMarkdown(body), 420) || `Stable release ${version}. Open the source for complete release notes.`,
        url: release.html_url,
        sourceSlug: context.source.slug,
        provider: config.provider,
        author: release.author?.login ?? null,
        publishedAt: release.published_at ?? release.created_at,
        fetchedAt: context.fetchedAt,
        tags: config.tags,
        externalScore: null,
        externalComments: null,
        metadata: {
          repository: config.repository,
          version: release.tag_name,
          prerelease: release.prerelease,
          breakingChange: /breaking|migration required|incompatible/i.test(body),
        },
      });
    });

  return { ...emptyAdapterResult(), items };
}
