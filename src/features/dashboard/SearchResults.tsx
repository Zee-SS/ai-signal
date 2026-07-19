import { ArrowSquareOut, MagnifyingGlass } from "@phosphor-icons/react";
import { EmptyState } from "@/components/EmptyState";
import type { SearchGroup } from "@/lib/filters";

interface SearchResultsProps {
  query: string;
  groups: SearchGroup[];
}

export function SearchResults({ query, groups }: SearchResultsProps) {
  if (!query.trim()) return null;
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  return (
    <section className="search-results" aria-labelledby="search-results-heading" aria-live="polite">
      <div className="section-heading section-heading--compact">
        <div>
          <h2 id="search-results-heading">Search results</h2>
          <p>{total} match{total === 1 ? "" : "es"} across the dashboard for “{query.trim()}”.</p>
        </div>
        <MagnifyingGlass aria-hidden="true" />
      </div>
      {groups.length ? (
        <div className="search-groups">
          {groups.map((group) => (
            <div className="search-group" key={group.label}>
              <h3>{group.label} <span>{group.count}</span></h3>
              <ul>
                {group.entries.map((entry) => (
                  <li key={`${group.label}-${entry.id}`}>
                    <a href={entry.href} target="_blank" rel="noopener noreferrer">
                      <span><strong>{entry.title}</strong><small>{entry.meta}</small></span>
                      <ArrowSquareOut aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No verified matches" description="Try a provider, model name, tool, tag, benchmark, or shorter phrase." />
      )}
    </section>
  );
}
