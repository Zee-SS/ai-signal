import { ArrowSquareOut, BookOpenText } from "@phosphor-icons/react";
import { formatCapeTownDate } from "@shared/lib/dates";
import type { ApiItem } from "@shared/schemas/domain";
import { EmptyState } from "@/components/EmptyState";

export function PapersSection({ items }: { items: ApiItem[] }) {
  const papers = items.filter((item) => item.itemType === "research").slice(0, 6);
  return (
    <section id="papers" className="dashboard-section papers-section" aria-labelledby="papers-heading">
      <div className="section-heading">
        <div>
          <h2 id="papers-heading">Papers worth reading</h2>
          <p>A small, relevance-filtered arXiv selection for coding, agents, reasoning, evaluation, retrieval, and inference.</p>
        </div>
      </div>
      {papers.length ? (
        <div className="paper-list">
          {papers.map((paper, index) => (
            <article className="paper-item" key={paper.id}>
              <span className="paper-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <div className="paper-item__meta">
                  <span>{paper.author ?? "Authors listed at source"}</span>
                  <time dateTime={paper.publishedAt}>{formatCapeTownDate(paper.publishedAt)}</time>
                </div>
                <h3>{paper.title}</h3>
                <p>{paper.summary}</p>
                <ul className="tag-list" aria-label="Paper relevance tags">
                  {paper.tags.filter((tag) => tag !== "research" && tag !== "arxiv").slice(0, 4).map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
              </div>
              <a href={paper.url} target="_blank" rel="noopener noreferrer" className="icon-button" aria-label={`Open ${paper.title} on arXiv in a new tab`}>
                <ArrowSquareOut aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No high-relevance papers yet" description="The arXiv adapter may be awaiting its first successful run or no recent paper met the configured relevance terms." action={<BookOpenText aria-hidden="true" />} />
      )}
    </section>
  );
}
