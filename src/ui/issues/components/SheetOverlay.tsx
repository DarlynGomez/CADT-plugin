import type { ReactNode } from "react";

import styles from "./SheetOverlay.module.css";

interface SheetOverlayProps {
  children: ReactNode;
}

/**
 * Dimmed backdrop over the whole panel with the sheet anchored to the bottom
 * Shared by the adjust and ignore sheets so they match
 */
export function SheetOverlay({ children }: SheetOverlayProps) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.sheet}>{children}</div>
    </div>
  );
}
