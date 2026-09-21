import type { IssueState } from "../../../shared/issues/issueTypes";
import styles from "./IssueActions.module.css";

interface IssueActionsProps {
  state: IssueState;
  ruleId: string;
  /** The raw 1 to 4 calibration answer for "How much should CADT do on its own?",
   *  or null when no calibration profile is loaded. Null hides Adjust, the same as
   *  level 1: without a known preference, defer to the most conservative behaviour */
  aiAssistanceLevel: number | null;
  onDefer: () => void;
  onFlagImportant: () => void;
  onAcknowledgeClick: () => void;
  onReopen: () => void;
  onFocus: () => void;
  onAdjustClick: () => void;
}

// Mirrors stateMachine.ts's allowed-source-state sets. Duplicated rather than shared
// because the UI cannot import from the plugin sandbox; the sandbox remains the
// authority; a button shown in error just gets rejected with ISSUE_ACTION_FAILED.
const DEFERRABLE_FROM: ReadonlySet<IssueState> = new Set(["open", "important"]);
const FLAGGABLE_FROM: ReadonlySet<IssueState> = new Set(["open", "deferred"]);
const ACKNOWLEDGABLE_FROM: ReadonlySet<IssueState> = new Set(["open", "deferred", "important"]);
const REOPENABLE_FROM: ReadonlySet<IssueState> = new Set(["deferred", "important", "acknowledged"]);
// Adjust is contrast-only and gated by calibration Q8, per ADJUST_SPEC.md section 2:
// level 1 shows no control at all.
const ADJUSTABLE_STATES: ReadonlySet<IssueState> = new Set(["open", "deferred", "important"]);

/** The actions available for an issue's current state, plus focus which is always available */
export function IssueActions({
  state,
  ruleId,
  aiAssistanceLevel,
  onDefer,
  onFlagImportant,
  onAcknowledgeClick,
  onReopen,
  onFocus,
  onAdjustClick
}: IssueActionsProps) {
  const canAdjust =
    ruleId === "contrast" && ADJUSTABLE_STATES.has(state) && (aiAssistanceLevel ?? 1) >= 2;

  return (
    <div className={styles.actions}>
      <button className={styles.actionButton} type="button" onClick={onFocus}>
        Show me
      </button>
      {canAdjust && (
        <button className={styles.actionButton} type="button" onClick={onAdjustClick}>
          Adjust
        </button>
      )}
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
