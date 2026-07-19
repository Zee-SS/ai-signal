import type { ApiItem } from "@shared/schemas/domain";
import { EmptyState } from "@/components/EmptyState";
import { SignalCard } from "@/components/SignalCard";

interface TodaySignalProps {
  items: ApiItem[];
  bookmarks: Set<string>;
  readItems: Set<string>;
  activeItemId: string | null;
  onBookmark: (item: ApiItem) => void;
  onRead: (item: ApiItem) => void;
  onInspect: (item: ApiItem) => void;
  onActivate: (item: ApiItem) => void;
}

export function TodaySignal(props: TodaySignalProps) {
  const { items } = props;
  const ranked = [...items]
    .filter((item) => item.itemType !== "community")
    .sort((left, right) => right.importanceScore - left.importanceScore || right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, 5);
  const renderCard = (item: ApiItem, variant: "dominant" | "supporting") => (
    <SignalCard
      key={item.id}
      item={item}
      variant={variant}
      bookmarked={props.bookmarks.has(item.id)}
      read={props.readItems.has(item.id)}
      active={props.activeItemId === item.id}
      onBookmark={props.onBookmark}
      onRead={props.onRead}
      onInspect={props.onInspect}
      onActivate={props.onActivate}
    />
  );

  return (
    <section id="today" className="dashboard-section today-section" aria-labelledby="today-heading">
      <div className="section-heading">
        <div>
          <h2 id="today-heading">Today’s signal</h2>
          <p>The few recent updates with the strongest verified relevance.</p>
        </div>
      </div>
      {ranked.length ? (
        <div className="today-layout">
          {renderCard(ranked[0] as ApiItem, "dominant")}
          <div className="today-supporting">
            {ranked.slice(1).map((item) => renderCard(item, "supporting"))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No verified signal matches these filters"
          description="Reset the filters or wait for the next source refresh. AI Signal will not fill this space with unverified items."
        />
      )}
    </section>
  );
}
