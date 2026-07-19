import { ArrowSquareOut, BookmarkSimple, Clock, Database, X } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { formatCapeTownDateTime } from "@shared/lib/dates";
import type { ApiItem } from "@shared/schemas/domain";

interface ItemDialogProps {
  item: ApiItem | null;
  bookmarked: boolean;
  onOpenChange: (open: boolean) => void;
  onBookmark: (item: ApiItem) => void;
}

export function ItemDialog({ item, bookmarked, onOpenChange, onBookmark }: ItemDialogProps) {
  return (
    <Dialog.Root open={item !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="item-dialog" aria-describedby="item-dialog-description">
          {item && (
            <>
              <div className="dialog-header">
                <div>
                  <span className="type-label">{item.itemType.replaceAll("_", " ")}</span>
                  <Dialog.Title>{item.title}</Dialog.Title>
                </div>
                <Dialog.Close className="icon-button" aria-label="Close item details">
                  <X aria-hidden="true" size={20} />
                </Dialog.Close>
              </div>
              <Dialog.Description id="item-dialog-description">{item.summary || "The source did not provide a short excerpt."}</Dialog.Description>
              <dl className="detail-list">
                <div><dt><Database aria-hidden="true" /> Source</dt><dd>{item.source.name}</dd></div>
                <div><dt><Clock aria-hidden="true" /> Published</dt><dd>{formatCapeTownDateTime(item.publishedAt)}</dd></div>
                <div><dt><Clock aria-hidden="true" /> Fetched</dt><dd>{formatCapeTownDateTime(item.fetchedAt)}</dd></div>
                <div><dt>Provider</dt><dd>{item.provider ?? "Not supplied"}</dd></div>
                <div><dt>Content type</dt><dd>{item.itemType.replaceAll("_", " ")}</dd></div>
              </dl>
              <div className="dialog-section">
                <h3>Why it ranks here</h3>
                {item.importanceReasons.length ? (
                  <ul className="reason-list">
                    {item.importanceReasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                ) : <p className="muted-copy">No ranking signals were recorded.</p>}
              </div>
              <div className="dialog-actions">
                <button type="button" className="button button--secondary" onClick={() => onBookmark(item)}>
                  <BookmarkSimple aria-hidden="true" weight={bookmarked ? "fill" : "regular"} />
                  {bookmarked ? "Bookmarked" : "Bookmark"}
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button--primary"
                >
                  Open original source
                  <ArrowSquareOut aria-hidden="true" />
                </a>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
