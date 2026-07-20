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

const repositorySchema = z.object({
  html_url: z.url(),
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  open_issues_count: z.number().int().nonnegative(),
  pushed_at: z.iso.datetime(),
  archived: z.boolean(),
  disabled: z.boolean(),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
});

function githubHeaders(context: AdapterContext): HeadersInit {
  const headers: HeadersInit = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (context.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${context.env.GITHUB_TOKEN}`;
  return headers;
}

export async function githubReleasesAdapter(context: AdapterContext): Promise<AdapterResult> {
  const config = context.source.adapter;
  if (config.type !== "github_releases") throw new Error("GitHub adapter received incompatible configuration");

  const url = `https://api.github.com/repos/${config.repository}/releases?per_page=12`;
  const response = await fetchWithPolicy(url, { headers: githubHeaders(context) }, { timeoutMs: 12_000, retries: 2 });
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

export async function githubRepositoryAdapter(context: AdapterContext): Promise<AdapterResult> {
  const config = context.source.adapter;
  if (config.type !== "github_repository") throw new Error("GitHub repository adapter received incompatible configuration");
  const response = await fetchWithPolicy(
    `https://api.github.com/repos/${config.repository}`,
    { headers: githubHeaders(context) },
    { timeoutMs: 12_000, retries: 2 },
  );
  const repository = repositorySchema.parse(await response.json());
  const itemType = config.kind === "agent" ? "coding_tool" : "community";
  const item = externalItemSchema.parse({
    itemType,
    title: config.projectName,
    summary: config.description,
    url: repository.html_url,
    sourceSlug: context.source.slug,
    provider: config.provider,
    author: config.repository.split("/")[0] ?? config.provider,
    publishedAt: repository.pushed_at,
    fetchedAt: context.fetchedAt,
    tags: [...config.tags, config.kind, config.surface, "github-activity"],
    externalScore: repository.stargazers_count,
    externalComments: repository.open_issues_count,
    metadata: {
      repository: config.repository,
      projectName: config.projectName,
      kind: config.kind,
      surface: config.surface,
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      openIssues: repository.open_issues_count,
      pushedAt: repository.pushed_at,
      archived: repository.archived,
      disabled: repository.disabled,
      license: repository.license?.spdx_id ?? null,
      qualitySignal: false,
    },
  });
  return { ...emptyAdapterResult(), items: [item] };
}
