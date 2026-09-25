import { useState } from "react";
import { RotateCcw } from "lucide-react";

import type { Root } from "../../../shared/grouping/groupingTypes";
import { IgnoredTrayDisclosure } from "./IgnoredTrayDisclosure";
import styles from "./IgnoredTrayRow.module.css";

interface IgnoredTrayRowProps {
  root: Root;
  reason: string | null;
  /** clearDecision is true exactly when issueIds covers every instance in the root */
  onRestore: (issueIds: readonly string[], clearDecision: boolean) => void;
}

/**
 * One ignored root's row. Restore, on the row itself, always restores every instance,
 * the common case. When the root has more than one instance, a "Related grouped
 * issues" disclosure, matching RootCard.tsx's own, offers a checkbox per instance so
 * the designer can restore a subset instead, on direct instruction after grouped
 * ignores were only restorable all at once.
 */
export function IgnoredTrayRow({ root, reason, onRestore }: IgnoredTrayRowProps) {
  const [checked, setChecked] = useState<ReadonlySet<string>>(
    () => new Set(root.instances.map((instance) => instance.issueId))
  );

  const name = `${root.foregroundBinding ?? root.foregroundHex} on ${root.backgroundHex}`;
  const representative = root.instances.find((i) => i.issueId === root.representativeIssueId);

  function toggle(issueId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  }

  return (
    <li className={styles.row}>
      <div className={styles.rowTop}>
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.name}>{name}</span>
        {representative && (
          <span className={styles.ratioChip}>{representative.measuredRatio.toFixed(2)}:1</span>
        )}
      </div>
      <div className={styles.rowBottom}>
        <p className={styles.reason}>Reason: &ldquo;{reason ?? "Reason not recorded"}&rdquo;</p>
        <button
          type="button"
          className={styles.restoreButton}
          onClick={() =>
            onRestore(
              root.instances.map((i) => i.issueId),
              true
            )
          }
        >
          <RotateCcw size={12} aria-hidden="true" />
          <span>Restore</span>
        </button>
      </div>
      {root.instances.length > 1 && (
        <IgnoredTrayDisclosure
          instances={root.instances}
          checked={checked}
          onToggle={toggle}
          onRestoreChecked={() => onRestore([...checked], checked.size === root.instances.length)}
        />
      )}
    </li>
  );
}
