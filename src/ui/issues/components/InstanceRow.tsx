import { Search } from "lucide-react";
import { useId } from "react";

import type { GroupableFinding } from "../../../shared/grouping/groupingTypes";
import styles from "./InstanceRow.module.css";

interface InstanceRowProps {
  instance: GroupableFinding;
  isCurrent: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onLocate: () => void;
}

/**
 * GROUPING_SPEC.md 6.4: layer name, screen, ratio, a checkbox, and a locate control.
 * The representative instance, section 3.5, is the one a single-instance Adjust
 * targets; it sorts first in the list and reads "(Current)" so the designer can see
 * which one that is without opening Adjust to find out.
 */
export function InstanceRow({
  instance,
  isCurrent,
  selected,
  onToggleSelected,
  onLocate
}: InstanceRowProps) {
  const checkboxId = useId();

  return (
    <li className={styles.row}>
      <input
        id={checkboxId}
        type="checkbox"
        className={styles.checkbox}
        checked={selected}
        onChange={onToggleSelected}
      />
      <label htmlFor={checkboxId} className={styles.label}>
        <span className={styles.name}>
          {instance.nodeName}
          {isCurrent && <span className={styles.currentTag}> (Current)</span>}
        </span>
        <span className={styles.meta}>
          {instance.screenName}, {instance.measuredRatio.toFixed(2)}:1
        </span>
      </label>
      <button
        type="button"
        className={styles.locate}
        onClick={onLocate}
        aria-label={`Locate ${instance.nodeName}`}
        title={`Locate ${instance.nodeName}`}
      >
        <Search size={14} aria-hidden="true" />
      </button>
    </li>
  );
}
