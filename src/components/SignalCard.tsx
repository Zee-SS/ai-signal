import {
  BookmarkSimple,
  Eye,
  EyeSlash,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react";
import type { ApiItem } from "@shared/schemas/domain";
import { Provenance } from "./Provenance";
import { WhyPopover } from "./WhyPopover";

interface SignalCardProps {
  item: ApiItem;
  variant?: "dominant" | "supporting" | "row";
  bookmarked: boolean;
  read: boolean;
  active: boolean;
  onBookmark: (item: ApiItem) => void;
  onRead: (item: ApiItem) => void;
  onInspect: (item: ApiItem) => void;
  onActivate: (item: ApiItem) => void;
}

const TYPE_LABELS: Record<ApiItem["itemType"], string> = {
  announcement: "Announcement",
  model_release: "Model",
  coding_tool: "Coding tool",
  benchmark: "Benchmark",
  research: "Research",
  open_weight_model: "Open weight",
  pricing_change: "Pricing",
  deprecation: "Deprecation",
  community: "Community",
};

export function SignalCard({
  item,
  variant = "row",
  bookmarked,
  read,
  active,
  onBookmark,
  onRead,
  onInspect,
  onActivate,
}: SignalCardProps) {
  return (
    <article
      className={`signal-card signal-card--${variant}`}
      data-type={item.itemType}
      data-feed-item={item.id}
      data-active={active ? "true" : "false"}
      data-read={read ? "true" : "false"}
      tabIndex={-1}
      onFocus={() => onActivate(item)}
      onPointerDown={() => onActivate(item)}
    >
      <div className="signal-card__topline">
        <div className="signal-card__labels">
          <span className="type-label">{TYPE_LABELS[item.itemType]}</span>
          {item.provider && <span className="provider-label">{item.provider}</span>}
          {!read && <span className="unread-label">Unread</span>}
        </div>
        <div className="signal-card__actions">
          <button
            type="button"
            className="icon-button"
            aria-label={bookmarked ? `Remove bookmark for ${item.title}` : `Bookmark ${item.title}`}
            aria-pressed={bookmarked}
            onClick={() => onBookmark(item)}
          >
            <BookmarkSimple aria-hidden="true" size={18} weight={bookmarked ? "fill" : "regular"} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={read ? `Mark ${item.title} unread` : `Mark ${item.title} read`}
            aria-pressed={read}
            onClick={() => onRead(item)}
          >
            {read ? <EyeSlash aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
          </button>
        </div>
      </div>
      <h3 className="signal-card__title">{item.title}</h3>
      <p className="signal-card__summary">{item.summary || "The source did not provide a short excerpt."}</p>
      <div className="signal-card__footer">
        <Provenance item={item} onOpenSource={() => { if (!read) onRead(item); }} compact={variant === "supporting"} />
        <div className="signal-card__footer-actions">
          <WhyPopover reasons={item.importanceReasons} score={item.importanceScore} />
          <button className="text-action" type="button" onClick={() => onInspect(item)}>
            <MagnifyingGlassPlus aria-hidden="true" size={16} />
            Inspect
          </button>
        </div>
      </div>
    </article>
  );
}
