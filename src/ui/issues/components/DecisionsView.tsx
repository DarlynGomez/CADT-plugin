import { RotateCcw } from "lucide-react";

import type { Root, RootDecision } from "../../../shared/grouping/groupingTypes";
import type { IssueSummary } from "../../../shared/issues/issueTypes";
import { RootSpecimen } from "./RootSpecimen";
import styles from "./DecisionsView.module.css";

function formatDate(iso: string | undefined): string {
  if (!iso) {
    return "";
  }
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

interface DecisionRowProps {
  root: Root;
  decision: RootDecision | undefined;
  representativeIssue: IssueSummary | undefined;
  onReopen: () => void;
}

/** GROUPING_SPEC.md 6.5's row styling amendment: dot, name, ratio chip, then the rest */
function DecisionRow({ root, decision, representativeIssue, onReopen }: DecisionRowProps) {
  const isResolvedOnly = !root.stateBreakdown.ignored && Boolean(root.stateBreakdown.resolved);
  const representative = root.instances.find((i) => i.issueId === root.representativeIssueId);
  const name = `${root.foregroundBinding ?? root.foregroundHex} on ${root.backgroundHex}`;

  return (
    <li className={styles.row}>
      <div className={styles.rowHeader}>
        <div className={styles.nameGroup}>
          <span className={styles.dot} aria-hidden="true" />
          <h3 className={styles.name}>{name}</h3>
          {representative && (
            <span className={styles.ratioChip}>{representative.measuredRatio.toFixed(2)}:1</span>
          )}
        </div>
        <span className={styles.date}>
          {isResolvedOnly
            ? formatDate(representativeIssue?.lastDetectedAt)
            : formatDate(decision?.recordedAt)}
        </span>
      </div>
      <RootSpecimen
        foregroundHex={root.foregroundHex}
        backgroundHex={root.backgroundHex}
        sampleText={representative?.nodeName ?? root.foregroundHex}
      />
      {isResolvedOnly ? (
        <p className={styles.fixed}>Fixed</p>
      ) : (
        <p className={styles.reason}>&ldquo;{decision?.reason ?? "Reason not recorded"}&rdquo;</p>
      )}
      <button type="button" className={styles.reopenButton} onClick={onReopen}>
        <RotateCcw size={12} aria-hidden="true" />
        <span>Reopen</span>
      </button>
    </li>
  );
}

interface DecisionsViewProps {
  roots: readonly Root[];
  decisions: Readonly<Record<string, RootDecision>>;
  issuesById: ReadonlyMap<string, IssueSummary>;
  onReopen: (issueIds: readonly string[], signature: string, clearDecision: boolean) => void;
}

/** GROUPING_SPEC.md 6.5: the accountability layer's output, name, specimen, reason, date, Reopen */
export function DecisionsView({ roots, decisions, issuesById, onReopen }: DecisionsViewProps) {
  if (roots.length === 0) {
    return <p className={styles.empty}>No decisions recorded yet.</p>;
  }

  return (
    <ul className={styles.list}>
      {roots.map((root) => (
        <DecisionRow
          key={root.signature}
          root={root}
          decision={decisions[root.signature]}
          representativeIssue={issuesById.get(root.representativeIssueId)}
          onReopen={() =>
            onReopen(
              root.instances.map((i) => i.issueId),
              root.signature,
              true
            )
          }
        />
      ))}
    </ul>
  );
}
