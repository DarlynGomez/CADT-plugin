import { HelpCircle, X } from "lucide-react";
import { useState } from "react";

import type { Severity } from "../../../shared/issues/issueTypes";
import { whySurfacedContext } from "../whySurfacedText";
import styles from "./WhySurfacedPopover.module.css";

interface WhySurfacedPopoverProps {
  measuredRatio: number;
  requiredRatio: number;
  severity: Severity;
}

/**
 * GROUPING_SPEC.md 6.3 item 7: a small "?" trigger opening plain-language context on
 * why the shortfall matters. Card-level explanation, not the Teach Me Why curriculum:
 * no WCAG citation, no link out.
 */
export function WhySurfacedPopover({
  measuredRatio,
  requiredRatio,
  severity
}: WhySurfacedPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-label="Why this surfaced"
        onClick={() => setOpen((value) => !value)}
      >
        <HelpCircle size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className={styles.popover} role="status">
          <div className={styles.header}>
            <span className={styles.title}>Why this surfaced</span>
            <button
              type="button"
              className={styles.close}
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          <p className={styles.ratioLine}>
            Contrast ratio <strong>{measuredRatio.toFixed(2)}:1</strong> / req{" "}
            {requiredRatio.toFixed(1)}:1
          </p>
          <p className={styles.context}>{whySurfacedContext(severity)}</p>
        </div>
      )}
    </div>
  );
}
