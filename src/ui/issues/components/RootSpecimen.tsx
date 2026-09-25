import type { CSSProperties } from "react";

import styles from "./RootSpecimen.module.css";

interface RootSpecimenProps {
  foregroundHex: string;
  backgroundHex: string;
  sampleText: string;
}

/**
 * GROUPING_SPEC.md 6.3: a short sample in the actual foreground colour on the actual
 * background, exactly as the Adjust tiles do. The colours are the file's own data, not
 * design tokens, so this is one of the sanctioned inline styles, CLAUDE.md rule 5.
 */
export function RootSpecimen({ foregroundHex, backgroundHex, sampleText }: RootSpecimenProps) {
  const style = { color: foregroundHex, backgroundColor: backgroundHex } as CSSProperties;
  return (
    <span className={styles.specimen} style={style}>
      {sampleText}
    </span>
  );
}
