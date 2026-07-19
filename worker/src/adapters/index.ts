import type { SourceType } from "../../../shared/schemas/domain";
import { arxivAdapter } from "./arxiv";
import { feedAdapter } from "./feed";
import { githubReleasesAdapter } from "./github";
import { hackerNewsAdapter } from "./hacker-news";
import { htmlMetadataAdapter } from "./html-metadata";
import { jsonApiAdapter } from "./json-api";
import { manualJsonAdapter } from "./manual";
import type { SourceAdapter } from "./types";

const ADAPTERS: Record<SourceType, SourceAdapter> = {
  rss: feedAdapter,
  atom: feedAdapter,
  github_releases: githubReleasesAdapter,
  json_api: jsonApiAdapter,
  arxiv: arxivAdapter,
  hacker_news: hackerNewsAdapter,
  manual_json: manualJsonAdapter,
  html_metadata: htmlMetadataAdapter,
};

export function getAdapter(type: SourceType): SourceAdapter {
  return ADAPTERS[type];
}
