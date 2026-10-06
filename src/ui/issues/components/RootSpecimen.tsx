import type { CSSProperties } from "react";

import styles from "./RootSpecimen.module.css";

interface RootSpecimenProps {
  foregroundHex: string;
  backgroundHex: string;
  sampleText: string;
}

/**
 * A sample in the real foreground on the real background
 * Colours come from the file and are not tokens, so inline styles are allowed
 */
export function RootSpecimen({ foregroundHex, backgroundHex, sampleText }: RootSpecimenProps) {
  const style = { color: foregroundHex, backgroundColor: backgroundHex } as CSSProperties;
  return (
    <span className={styles.specimen} style={style}>
      {sampleText}
    </span>
  );
}
