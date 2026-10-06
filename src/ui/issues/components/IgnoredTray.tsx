import { ChevronDown, ChevronRight, EyeOff } from "lucide-react";

import type { Root, RootDecision } from "../../../shared/grouping/groupingTypes";
import { IgnoredTrayRow } from "./IgnoredTrayRow";
import styles from "./IgnoredTray.module.css";

interface IgnoredTrayProps {
  roots: readonly Root[];
  decisions: Readonly<Record<string, RootDecision>>;
  onRestore: (issueIds: readonly string[], signature: string, clearDecision: boolean) => void;
}

/**
 * Collapsed tray of ignored roots at the bottom of the list
 * A quick peek that sits beside the Ignored filter and does not replace it
 */
export function IgnoredTray({ roots, decisions, onRestore }: IgnoredTrayProps) {
  if (roots.length === 0) {
    return null;
  }

  return (
    <details className={styles.tray}>
      <summary className={styles.summary}>
        <span className={styles.summaryLeft}>
          <EyeOff size={14} aria-hidden="true" />
          <span>Ignored issues ({roots.length})</span>
        </span>
        <span className={styles.summaryRight}>
          <span className={styles.stateClosed}>
            Review
            <ChevronRight size={14} aria-hidden="true" />
          </span>
          <span className={styles.stateOpen}>
            Hide
            <ChevronDown size={14} aria-hidden="true" />
          </span>
        </span>
      </summary>
      <ul className={styles.list}>
        {roots.map((root) => (
          <IgnoredTrayRow
            key={root.signature}
            root={root}
            reason={decisions[root.signature]?.reason ?? null}
            onRestore={(issueIds, clearDecision) =>
              onRestore(issueIds, root.signature, clearDecision)
            }
          />
        ))}
      </ul>
    </details>
  );
}
