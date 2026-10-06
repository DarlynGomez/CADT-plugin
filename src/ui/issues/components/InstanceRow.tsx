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
 * Layer name, screen, ratio, a checkbox and a locate button
 * The representative is the one a single adjust targets, so it is marked Current
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
