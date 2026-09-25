import { matchRootDecision } from "../../../shared/grouping/decisionMatch";
import type { Root, RootDecision } from "../../../shared/grouping/groupingTypes";
import type { RootSection } from "../../../shared/grouping/sectionRoots";
import type { IssueSummary } from "../../../shared/issues/issueTypes";
import { IgnoredTray } from "./IgnoredTray";
import { RootCard } from "./RootCard";
import styles from "./ToReviewList.module.css";

const EMPTY_SELECTION: ReadonlySet<string> = new Set();

interface ToReviewListProps {
  sections: readonly RootSection[];
  issuesById: ReadonlyMap<string, IssueSummary>;
  decisions: Readonly<Record<string, RootDecision>>;
  ignoredRoots: readonly Root[];
  onRestoreIgnored: (
    issueIds: readonly string[],
    signature: string,
    clearDecision: boolean
  ) => void;
  canAdjust: boolean;
  selectedInstances: Readonly<Record<string, ReadonlySet<string>>>;
  onToggleInstanceSelected: (signature: string, issueId: string) => void;
  onSelectAllInstances: (root: Root) => void;
  onShowOnCanvas: (root: Root) => void;
  onLocate: (issueId: string) => void;
  onAdjust: (signature: string) => void;
  onIgnore: (signature: string) => void;
  onDefer: (root: Root) => void;
  onToggleImportant: (root: Root) => void;
  onApplyDecisionOffer: (root: Root, decision: RootDecision) => void;
  onRestoreDeferred: (root: Root) => void;
}

/** GROUPING_SPEC.md 6.2's sectioned list: unsectioned for root cause, headed sections otherwise */
export function ToReviewList(props: ToReviewListProps) {
  const { sections, issuesById, decisions } = props;

  if (sections.length === 0) {
    return (
      <div className={styles.sections}>
        <p className={styles.empty}>Nothing to review. Nice work.</p>
        <IgnoredTray
          roots={props.ignoredRoots}
          decisions={decisions}
          onRestore={props.onRestoreIgnored}
        />
      </div>
    );
  }

  return (
    <div className={styles.sections}>
      {sections.map((section) => (
        <section key={section.key}>
          {section.label && <h3 className={styles.sectionLabel}>{section.label}</h3>}
          <ul className={styles.list}>
            {section.roots.map((root) => {
              const decisionOffer = matchRootDecision(root, decisions);
              // A partially reopened root can still carry its old decision on some
              // instances; the offer banner handles the "brand new match" case, this
              // note handles "you already decided on part of this one."
              const recordedReason = root.stateBreakdown.ignored
                ? (decisions[root.signature]?.reason ?? null)
                : null;
              return (
                <RootCard
                  key={root.signature}
                  root={root}
                  representativeIssue={issuesById.get(root.representativeIssueId)}
                  canAdjust={props.canAdjust}
                  decisionOffer={decisionOffer}
                  recordedReason={recordedReason}
                  selectedInstanceIds={props.selectedInstances[root.signature] ?? EMPTY_SELECTION}
                  onToggleInstanceSelected={(issueId) =>
                    props.onToggleInstanceSelected(root.signature, issueId)
                  }
                  onSelectAllInstances={() => props.onSelectAllInstances(root)}
                  onShowOnCanvas={() => props.onShowOnCanvas(root)}
                  onLocate={props.onLocate}
                  onAdjust={() => props.onAdjust(root.signature)}
                  onIgnore={() => props.onIgnore(root.signature)}
                  onDefer={() => props.onDefer(root)}
                  onToggleImportant={() => props.onToggleImportant(root)}
                  onApplyDecisionOffer={() =>
                    decisionOffer.decision &&
                    props.onApplyDecisionOffer(root, decisionOffer.decision)
                  }
                  onRestoreDeferred={() => props.onRestoreDeferred(root)}
                />
              );
            })}
          </ul>
        </section>
      ))}
      <IgnoredTray
        roots={props.ignoredRoots}
        decisions={decisions}
        onRestore={props.onRestoreIgnored}
      />
    </div>
  );
}
