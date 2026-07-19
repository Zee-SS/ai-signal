import { ArrowSquareOut } from "@phosphor-icons/react";
import { formatCapeTownDate } from "@shared/lib/dates";
import type { ApiItem } from "@shared/schemas/domain";

interface ProvenanceProps {
  item: ApiItem;
  onOpenSource?: () => void;
  compact?: boolean;
}

export function Provenance({ item, onOpenSource, compact = false }: ProvenanceProps) {
  return (
    <div className={compact ? "provenance provenance--compact" : "provenance"}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="source-link"
        onClick={onOpenSource}
        aria-label={`Open original source from ${item.source.name} in a new tab`}
      >
        {item.source.name}
        <ArrowSquareOut aria-hidden="true" size={14} weight="bold" />
      </a>
      <span className="provenance__divider" aria-hidden="true" />
      <time dateTime={item.publishedAt}>{formatCapeTownDate(item.publishedAt)}</time>
      {!compact && (
        <>
          <span className="provenance__divider" aria-hidden="true" />
          <span>Fetched {formatCapeTownDate(item.fetchedAt)}</span>
        </>
      )}
    </div>
  );
}
