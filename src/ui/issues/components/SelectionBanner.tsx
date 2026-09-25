import { RotateCcw } from "lucide-react";

import styles from "./SelectionBanner.module.css";

interface SelectionBannerProps {
  count: number;
  onRestore: () => void;
}

/** GROUPING_SPEC.md 5.1: "Showing N layers on canvas" with a Restore selection control */
export function SelectionBanner({ count, onRestore }: SelectionBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <span>
        Showing {count} {count === 1 ? "layer" : "layers"} on canvas
      </span>
      <button type="button" className={styles.restoreButton} onClick={onRestore}>
        <RotateCcw size={12} aria-hidden="true" />
        <span>Restore selection</span>
      </button>
    </div>
  );
}
