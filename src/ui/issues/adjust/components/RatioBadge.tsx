import { passLevel } from "../../../../shared/colour/passLevel";
import styles from "./RatioBadge.module.css";

interface RatioBadgeProps {
  achievedRatio: number;
  requiredRatio: number;
}

/** A neutral pill with ratio and pass level, inline beside the option title */
export function RatioBadge({ achievedRatio, requiredRatio }: RatioBadgeProps) {
  const level = passLevel(achievedRatio, requiredRatio);

  return (
    <span className={styles.badge}>
      {achievedRatio.toFixed(2)}:1 (<span className={styles.level}>{level}</span>)
    </span>
  );
}
