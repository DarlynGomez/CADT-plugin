import type { RootDisplayState } from "../../../shared/grouping/groupingTypes";
import styles from "./RootStatusDot.module.css";

const LABEL: Partial<Record<RootDisplayState, string>> = {
  open: "Status: open",
  important: "Status: important",
  deferred: "Status: deferred"
};

interface RootStatusDotProps {
  displayState: RootDisplayState;
}

/**
 * Status dot, open green, important warning red, deferred muted grey
 * Colour is extra, the aria label carries the same word, decided roots never show it
 */
export function RootStatusDot({ displayState }: RootStatusDotProps) {
  if (displayState === "decided") {
    return null;
  }
  return (
    <span
      className={`${styles.dot} ${styles[displayState]}`}
      role="img"
      aria-label={LABEL[displayState]}
    />
  );
}
