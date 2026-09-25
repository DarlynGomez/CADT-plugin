import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";

import type { GroupableFinding } from "../../../shared/grouping/groupingTypes";
import styles from "./IgnoredTrayDisclosure.module.css";

interface IgnoredTrayDisclosureProps {
  instances: readonly GroupableFinding[];
  checked: ReadonlySet<string>;
  onToggle: (issueId: string) => void;
  onRestoreChecked: () => void;
}

/** The Ignored tray row's own "Related grouped issues" disclosure, checkboxes for a partial restore */
export function IgnoredTrayDisclosure({
  instances,
  checked,
  onToggle,
  onRestoreChecked
}: IgnoredTrayDisclosureProps) {
  return (
    <details className={styles.disclosure}>
      <summary className={styles.summary}>
        <ChevronRight className={styles.chevronClosed} size={14} aria-hidden="true" />
        <ChevronDown className={styles.chevronOpen} size={14} aria-hidden="true" />
        <span>Related grouped issues</span>
        <span className={styles.countBubble}>+{instances.length}</span>
      </summary>
      <ul className={styles.instanceList}>
        {instances.map((instance) => (
          <li key={instance.issueId} className={styles.instanceRow}>
            <label className={styles.instanceLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={checked.has(instance.issueId)}
                onChange={() => onToggle(instance.issueId)}
              />
              <span className={styles.instanceName}>{instance.nodeName}</span>
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.restoreSelectedButton}
        disabled={checked.size === 0}
        onClick={onRestoreChecked}
      >
        <RotateCcw size={12} aria-hidden="true" />
        <span>Restore checked ({checked.size})</span>
      </button>
    </details>
  );
}
