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
 * A colour-only status indicator, open (green), important (reuses the warning red),
 * deferred (muted grey). Colour is supplementary here, never the only signal: the
 * dot carries an aria-label with the same word a sighted user would read from
 * context, so nothing is conveyed by colour alone. A decided root never renders this.
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
