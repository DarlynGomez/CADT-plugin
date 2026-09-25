import { passLevel } from "../../../../shared/colour/passLevel";
import styles from "./RatioBadge.module.css";

interface RatioBadgeProps {
  achievedRatio: number;
  requiredRatio: number;
}

/** A neutral pill, ratio and pass level together, sitting inline beside an option's title */
export function RatioBadge({ achievedRatio, requiredRatio }: RatioBadgeProps) {
  const level = passLevel(achievedRatio, requiredRatio);

  return (
    <span className={styles.badge}>
      {achievedRatio.toFixed(2)}:1 (<span className={styles.level}>{level}</span>)
    </span>
  );
}
