import { ChevronDown, ChevronRight } from "lucide-react";

import type { DecisionMatch, Root } from "../../../shared/grouping/groupingTypes";
import { readContrastEvidence } from "../../../shared/issues/contrastEvidenceView";
import type { IssueSummary } from "../../../shared/issues/issueTypes";
import { InstanceList } from "./InstanceList";
import { RootActionsArea } from "./RootActionsArea";
import styles from "./RootCard.module.css";
import { RootCardSummary } from "./RootCardSummary";

interface RootCardProps {
  root: Root;
  representativeIssue: IssueSummary | undefined;
  canAdjust: boolean;
  decisionOffer: DecisionMatch;
  recordedReason: string | null;
  selectedInstanceIds: ReadonlySet<string>;
  onToggleInstanceSelected: (issueId: string) => void;
  onSelectAllInstances: () => void;
  onShowOnCanvas: () => void;
  onLocate: (issueId: string) => void;
  onAdjust: () => void;
  onIgnore: () => void;
  onDefer: () => void;
  onToggleImportant: () => void;
  onApplyDecisionOffer: () => void;
}

/**
 * GROUPING_SPEC.md 6.3's root card, top to bottom exactly as the section orders it.
 * The instances disclosure is a native `<details>`, uncontrolled: which is open is
 * display-only state nothing outside this card needs to coordinate with.
 */
export function RootCard({
  root,
  representativeIssue,
  canAdjust,
  decisionOffer,
  recordedReason,
  selectedInstanceIds,
  onToggleInstanceSelected,
  onSelectAllInstances,
  onShowOnCanvas,
  onLocate,
  onAdjust,
  onIgnore,
  onDefer,
  onToggleImportant,
  onApplyDecisionOffer
}: RootCardProps) {
  const representativeEvidence = representativeIssue
    ? readContrastEvidence(representativeIssue.ruleId, representativeIssue.evidence)
    : null;

  return (
    <li className={styles.card}>
      <RootCardSummary
        root={root}
        representativeEvidence={representativeEvidence}
        recordedReason={recordedReason}
      />

      <RootActionsArea
        root={root}
        canAdjust={canAdjust}
        decisionOffer={decisionOffer}
        onAdjust={onAdjust}
        onIgnore={onIgnore}
        onDefer={onDefer}
        onToggleImportant={onToggleImportant}
        onApplyDecisionOffer={onApplyDecisionOffer}
      />

      {root.instances.length > 1 && (
        <details className={styles.instancesDisclosure}>
          <summary className={styles.summary}>
            <span className={styles.summaryLeft}>
              <ChevronRight className={styles.chevronClosed} size={16} aria-hidden="true" />
              <ChevronDown className={styles.chevronOpen} size={16} aria-hidden="true" />
              <span>Related grouped issues</span>
            </span>
            <span className={styles.countBubble}>+{root.instances.length}</span>
          </summary>
          <InstanceList
            instances={root.instances}
            selectedIds={selectedInstanceIds}
            onToggleSelected={onToggleInstanceSelected}
            onSelectAll={onSelectAllInstances}
            onShowOnCanvas={onShowOnCanvas}
            onLocate={onLocate}
          />
        </details>
      )}
    </li>
  );
}
