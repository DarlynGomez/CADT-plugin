import { Search } from "lucide-react";
import { useId } from "react";

import type { GroupableFinding } from "../../../shared/grouping/groupingTypes";
import styles from "./InstanceRow.module.css";

interface InstanceRowProps {
  instance: GroupableFinding;
  selected: boolean;
  onToggleSelected: () => void;
  onLocate: () => void;
}

/** GROUPING_SPEC.md 6.4: layer name, screen, ratio, a checkbox, and a locate control */
export function InstanceRow({ instance, selected, onToggleSelected, onLocate }: InstanceRowProps) {
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
        <span className={styles.name}>{instance.nodeName}</span>
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
