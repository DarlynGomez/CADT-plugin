import type { ReactNode } from "react";

import styles from "./SheetOverlay.module.css";

interface SheetOverlayProps {
  children: ReactNode;
}

/**
 * ADR-027: Adjust and Ignore are true overlay sheets, a dimmed backdrop over the whole
 * panel with the sheet itself anchored to the bottom edge, not inline replacements of a
 * card's actions row. Shared by both sheets so they read as one family.
 */
export function SheetOverlay({ children }: SheetOverlayProps) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.sheet}>{children}</div>
    </div>
  );
}
