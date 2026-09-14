import type { IssueState } from "../../../shared/issues/issueTypes";
import styles from "./IssueActions.module.css";

interface IssueActionsProps {
  state: IssueState;
  onDefer: () => void;
  onFlagImportant: () => void;
  onAcknowledgeClick: () => void;
  onReopen: () => void;
  onFocus: () => void;
}

// Mirrors stateMachine.ts's allowed-source-state sets. Duplicated rather than shared
// because the UI cannot import from the plugin sandbox; the sandbox remains the
// authority; a button shown in error just gets rejected with ISSUE_ACTION_FAILED.
const DEFERRABLE_FROM: ReadonlySet<IssueState> = new Set(["open", "important"]);
const FLAGGABLE_FROM: ReadonlySet<IssueState> = new Set(["open", "deferred"]);
const ACKNOWLEDGABLE_FROM: ReadonlySet<IssueState> = new Set(["open", "deferred", "important"]);
const REOPENABLE_FROM: ReadonlySet<IssueState> = new Set(["deferred", "important", "acknowledged"]);

/** The actions available for an issue's current state, plus focus which is always available */
export function IssueActions({
  state,
  onDefer,
  onFlagImportant,
  onAcknowledgeClick,
  onReopen,
  onFocus
}: IssueActionsProps) {
  return (
    <div className={styles.actions}>
      <button className={styles.actionButton} type="button" onClick={onFocus}>
        Show me
      </button>
      {DEFERRABLE_FROM.has(state) && (
        <button className={styles.secondaryButton} type="button" onClick={onDefer}>
          Defer
        </button>
      )}
      {FLAGGABLE_FROM.has(state) && (
        <button className={styles.secondaryButton} type="button" onClick={onFlagImportant}>
          Flag as important
        </button>
      )}
      {ACKNOWLEDGABLE_FROM.has(state) && (
        <button className={styles.secondaryButton} type="button" onClick={onAcknowledgeClick}>
          Acknowledge
        </button>
      )}
      {REOPENABLE_FROM.has(state) && (
        <button className={styles.secondaryButton} type="button" onClick={onReopen}>
          Reopen
        </button>
      )}
    </div>
  );
}
