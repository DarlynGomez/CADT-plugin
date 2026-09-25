import { Clock, EyeOff, Pin, Sliders } from "lucide-react";

import type { Root } from "../../../shared/grouping/groupingTypes";
import styles from "./RootActionsRow.module.css";

interface RootActionsRowProps {
  root: Root;
  canAdjust: boolean;
  onAdjust: () => void;
  onIgnore: () => void;
  onDefer: () => void;
  onToggleImportant: () => void;
}

/**
 * GROUPING_SPEC.md 6.3 item 8: Adjust and Ignore on the left, Defer and the Pin
 * toggle on the right. A fully decided root, section 3.2, offers none of these; that
 * is what the Decisions view and its Reopen control are for instead.
 */
export function RootActionsRow({
  root,
  canAdjust,
  onAdjust,
  onIgnore,
  onDefer,
  onToggleImportant
}: RootActionsRowProps) {
  if (root.displayState === "decided") {
    return null;
  }

  const isImportant = root.displayState === "important";
  const canDefer = (root.stateBreakdown.open ?? 0) > 0;

  return (
    <div className={styles.actions}>
      <div className={styles.leftGroup}>
        {canAdjust && (
          <button type="button" className={styles.primaryButton} onClick={onAdjust}>
            <Sliders size={14} aria-hidden="true" />
            <span>Adjust</span>
          </button>
        )}
        <button type="button" className={styles.secondaryButton} onClick={onIgnore}>
          <EyeOff size={14} aria-hidden="true" />
          <span>Ignore</span>
        </button>
      </div>
      <div className={styles.rightGroup}>
        {canDefer && (
          <button type="button" className={styles.secondaryButton} onClick={onDefer}>
            <Clock size={14} aria-hidden="true" />
            <span>Defer</span>
          </button>
        )}
        <button
          type="button"
          className={`${styles.importantToggle} ${isImportant ? styles.importantActive : ""}`}
          aria-pressed={isImportant}
          aria-label={isImportant ? "Remove important flag" : "Flag as important"}
          title={isImportant ? "Remove important flag" : "Flag as important"}
          onClick={onToggleImportant}
        >
          <Pin size={14} aria-hidden="true" fill={isImportant ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}
