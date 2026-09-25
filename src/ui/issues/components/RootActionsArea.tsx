import type { DecisionMatch, Root } from "../../../shared/grouping/groupingTypes";
import { DecisionOfferBanner } from "./DecisionOfferBanner";
import { RootActionsRow } from "./RootActionsRow";

interface RootActionsAreaProps {
  root: Root;
  canAdjust: boolean;
  decisionOffer: DecisionMatch;
  onAdjust: () => void;
  onIgnore: () => void;
  onDefer: () => void;
  onToggleImportant: () => void;
  onApplyDecisionOffer: () => void;
}

/**
 * Section 6.3 item 8's actions row, plus the decision-offer banner above it. The Adjust
 * and Ignore sheets themselves are no longer rendered here, ADR-027: they are
 * panel-covering overlays now, hosted once at the panel root by RootSheetHost.tsx, so
 * this component's only job is the buttons that open them.
 */
export function RootActionsArea({
  root,
  canAdjust,
  decisionOffer,
  onAdjust,
  onIgnore,
  onDefer,
  onToggleImportant,
  onApplyDecisionOffer
}: RootActionsAreaProps) {
  if (root.displayState === "decided") {
    return null;
  }

  return (
    <>
      {decisionOffer.offered && decisionOffer.decision ? (
        <DecisionOfferBanner
          reason={decisionOffer.decision.reason}
          onApply={onApplyDecisionOffer}
        />
      ) : null}
      <RootActionsRow
        root={root}
        canAdjust={canAdjust}
        onAdjust={onAdjust}
        onIgnore={onIgnore}
        onDefer={onDefer}
        onToggleImportant={onToggleImportant}
      />
    </>
  );
}
