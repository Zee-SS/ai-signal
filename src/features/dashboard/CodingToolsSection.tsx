import { ArrowSquareOut, Warning } from "@phosphor-icons/react";
import { formatCapeTownDate } from "@shared/lib/dates";
import type { ApiItem } from "@shared/schemas/domain";
import { EmptyState } from "@/components/EmptyState";

interface ToolGroup {
  key: string;
  latest: ApiItem;
  releaseCount: number;
}

function groupTools(items: ApiItem[]): ToolGroup[] {
  const grouped = new Map<string, ApiItem[]>();
  for (const item of items.filter((entry) => entry.itemType === "coding_tool")) {
    const repository = typeof item.metadata.repository === "string" ? item.metadata.repository : item.source.slug;
    const current = grouped.get(repository) ?? [];
    current.push(item);
    grouped.set(repository, current);
  }
  return [...grouped.entries()].map(([key, releases]) => {
    const sorted = releases.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
    return { key, latest: sorted[0] as ApiItem, releaseCount: sorted.length };
  }).sort((left, right) => right.latest.publishedAt.localeCompare(left.latest.publishedAt));
}

export function CodingToolsSection({ items }: { items: ApiItem[] }) {
  const groups = groupTools(items);
  return (
    <section id="coding-tools" className="dashboard-section tools-section" aria-labelledby="tools-heading">
      <div className="section-heading">
        <div>
          <h2 id="tools-heading">Coding tools and agents</h2>
          <p>Stable GitHub releases from Codex, Claude Code, Gemini CLI, and Aider. Prereleases are excluded by default.</p>
        </div>
      </div>
      {groups.length ? (
        <div className="tool-list">
          {groups.map(({ key, latest, releaseCount }) => {
            const version = typeof latest.metadata.version === "string" ? latest.metadata.version : latest.title.split(" ").at(-1);
            const breaking = latest.metadata.breakingChange === true;
            return (
              <article className="tool-release" key={key}>
                <div className="tool-release__version">
                  <span>{version ?? "Stable"}</span>
                  <time dateTime={latest.publishedAt}>{formatCapeTownDate(latest.publishedAt)}</time>
                </div>
                <div className="tool-release__body">
                  <div className="tool-release__heading">
                    <h3>{latest.provider ?? key}</h3>
                    {breaking && <span className="breaking-label"><Warning aria-hidden="true" /> Breaking change</span>}
                  </div>
                  <p>{latest.summary}</p>
                  {releaseCount > 1 && <small>{releaseCount - 1} related release{releaseCount - 1 === 1 ? "" : "s"} grouped to reduce noise.</small>}
                </div>
                <a href={latest.url} target="_blank" rel="noopener noreferrer" className="button button--secondary" aria-label={`Open ${latest.title} release notes in a new tab`}>
                  Release notes
                  <ArrowSquareOut aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No stable coding-tool releases match" description="The configured GitHub sources may be awaiting their first sync, unavailable, or excluded by the active filters." />
      )}
    </section>
  );
}
