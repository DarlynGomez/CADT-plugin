import styles from "./RatioBadge.module.css";

interface RatioBadgeProps {
  achievedRatio: number;
  requiredRatio: number;
}

const AAA_NORMAL_TEXT = 7.0;
const AAA_LARGE_TEXT = 4.5;

/**
 * AA always applies here, since a tile is never shown unless it already clears
 * requiredRatio. AAA is judged against the stricter level for the same size class the
 * finding itself used, derived from requiredRatio rather than needing its own field
 */
export function RatioBadge({ achievedRatio, requiredRatio }: RatioBadgeProps) {
  const aaaThreshold = requiredRatio === 3.0 ? AAA_LARGE_TEXT : AAA_NORMAL_TEXT;
  const level = achievedRatio >= aaaThreshold ? "AAA" : "AA";

  return (
    <span className={styles.badge}>
      {achievedRatio.toFixed(2)}:1 <span className={styles.level}>{level}</span>
    </span>
  );
}
