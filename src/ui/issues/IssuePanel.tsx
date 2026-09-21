import { useState } from "react";

import type { IssueState, IssueSummary } from "../../shared/issues/issueTypes";
import { IssueCard } from "./components/IssueCard";
import { useIssues } from "./hooks/useIssues";
import styles from "./IssuePanel.module.css";

const MAIN_LIST_ORDER: readonly IssueState[] = ["important", "open", "deferred"];
const SECONDARY_STATES: ReadonlySet<IssueState> = new Set(["acknowledged", "resolved"]);

function groupForMainList(issues: readonly IssueSummary[]): IssueSummary[] {
  return MAIN_LIST_ORDER.flatMap((state) => issues.filter((issue) => issue.state === state));
}

interface IssuePanelProps {
  /** The raw 1 to 4 "How much should CADT do on its own?" answer, or null when no
   *  calibration profile is loaded, which gates the Adjust control on each card */
  aiAssistanceLevel: number | null;
}

/** The panel: important above open above deferred; acknowledged and resolved reachable, not listed */
export function IssuePanel({ aiAssistanceLevel }: IssuePanelProps) {
  const {
    issues,
    loading,
    actionError,
    deferIssue,
    flagImportant,
    reopenIssue,
    acknowledgeIssue,
    focusIssue
  } = useIssues();
  const [showSecondary, setShowSecondary] = useState(false);

  if (loading) {
    return <p className={styles.status}>Loading issues...</p>;
  }

  const mainIssues = groupForMainList(issues);
  const secondaryIssues = issues.filter((issue) => SECONDARY_STATES.has(issue.state));

  function renderList(list: readonly IssueSummary[]) {
    return (
      <ul className={styles.list}>
        {list.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            aiAssistanceLevel={aiAssistanceLevel}
            onDefer={deferIssue}
            onFlagImportant={flagImportant}
            onReopen={reopenIssue}
            onAcknowledge={acknowledgeIssue}
            onFocus={focusIssue}
          />
        ))}
      </ul>
    );
  }

  return (
    <main className={styles.panel} aria-labelledby="issue-panel-heading">
      <h2 id="issue-panel-heading" className={styles.heading}>
        Accessibility issues
      </h2>
      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.message}
        </p>
      )}
      {mainIssues.length === 0 ? (
        <p className={styles.status}>No open issues. Nice work.</p>
      ) : (
        renderList(mainIssues)
      )}
      {secondaryIssues.length > 0 && (
        <div className={styles.secondary}>
          <button
            type="button"
            className={styles.secondaryToggle}
            onClick={() => setShowSecondary((visible) => !visible)}
            aria-expanded={showSecondary}
          >
            {showSecondary ? "Hide" : "Show"} acknowledged and resolved ({secondaryIssues.length})
          </button>
          {showSecondary && renderList(secondaryIssues)}
        </div>
      )}
    </main>
  );
}
