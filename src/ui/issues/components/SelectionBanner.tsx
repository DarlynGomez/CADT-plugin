import { RotateCcw } from "lucide-react";

import styles from "./SelectionBanner.module.css";

interface SelectionBannerProps {
  count: number;
  onRestore: () => void;
}

/** Shows how many layers are on canvas with a button to restore the selection */
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
