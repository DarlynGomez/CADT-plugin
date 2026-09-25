import styles from "./BackgroundAncestorCallout.module.css";

interface BackgroundAncestorCalloutProps {
  backgroundAncestorName: string;
  backgroundHex: string;
}

/** The wheel's own context strip: which ancestor's background it is solving against */
export function BackgroundAncestorCallout({
  backgroundAncestorName,
  backgroundHex
}: BackgroundAncestorCalloutProps) {
  return (
    <div className={styles.ancestor}>
      <div className={styles.ancestorLeft}>
        <span className={styles.ancestorSwatch} style={{ backgroundColor: backgroundHex }} />
        <span className={styles.ancestorText}>
          <span className={styles.ancestorLabel}>Inspecting Background Ancestor:</span>
          <span className={styles.ancestorName}>{backgroundAncestorName}</span>
        </span>
      </div>
      <span className={styles.ancestorHex}>{backgroundHex}</span>
    </div>
  );
}
