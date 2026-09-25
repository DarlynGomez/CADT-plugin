import type { CSSProperties } from "react";

import type { Root } from "../../../shared/grouping/groupingTypes";
import {
  backgroundSourceName,
  type ContrastEvidenceView
} from "../../../shared/issues/contrastEvidenceView";
import styles from "./RootMetadataGrid.module.css";

interface RootMetadataGridProps {
  root: Root;
  measuredRatio: number;
  representativeEvidence: ContrastEvidenceView | null;
}

/**
 * GROUPING_SPEC.md 6.3 item 6: the two-column grid restored from the mockup, for
 * scanning at a glance. The colours in the swatches are the file's own data, not
 * tokens, the same sanctioned exception RootSpecimen.tsx uses, CLAUDE.md rule 5.
 */
export function RootMetadataGrid({
  root,
  measuredRatio,
  representativeEvidence
}: RootMetadataGridProps) {
  const fgStyle = { backgroundColor: root.foregroundHex } as CSSProperties;
  const bgStyle = { backgroundColor: root.backgroundHex } as CSSProperties;

  return (
    <div className={styles.grid}>
      <div className={styles.cell}>
        <span className={styles.label}>Ratio & WCAG</span>
        <span className={styles.value}>
          {measuredRatio.toFixed(2)}:1{" "}
          <span className={styles.muted}>/ req {root.requiredRatio}:1</span>
        </span>
      </div>
      <div className={styles.cell}>
        <span className={styles.label}>Background Ancestor</span>
        <span className={styles.value}>{backgroundSourceName(representativeEvidence)}</span>
      </div>
      <div className={styles.cell}>
        <span className={styles.label}>Foreground & Background</span>
        <span className={styles.value}>
          <span className={styles.swatch} style={fgStyle} /> {root.foregroundHex} /{" "}
          <span className={styles.swatch} style={bgStyle} /> {root.backgroundHex}
        </span>
      </div>
      <div className={styles.cell}>
        <span className={styles.label}>Variable Binding</span>
        <span className={styles.value}>{root.foregroundBinding ?? "unbound"}</span>
      </div>
    </div>
  );
}
