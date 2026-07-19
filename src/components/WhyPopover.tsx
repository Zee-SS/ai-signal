import { Info, X } from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";

interface WhyPopoverProps {
  reasons: string[];
  score: number;
}

function signalBand(score: number): string {
  if (score >= 75) return "High signal";
  if (score >= 45) return "Notable signal";
  return "Context signal";
}

export function WhyPopover({ reasons, score }: WhyPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="text-action" type="button">
          <Info aria-hidden="true" size={16} />
          Why this matters
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="why-popover" sideOffset={8} collisionPadding={16}>
          <div className="why-popover__heading">
            <div>
              <strong>{signalBand(score)}</strong>
              <span>Relative ranking signal, not an objective quality score.</span>
            </div>
            <Popover.Close className="icon-button icon-button--small" aria-label="Close explanation">
              <X aria-hidden="true" size={16} />
            </Popover.Close>
          </div>
          {reasons.length ? (
            <ul className="reason-list">
              {reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          ) : (
            <p className="muted-copy">No ranking details were recorded for this item.</p>
          )}
          <Popover.Arrow className="why-popover__arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
