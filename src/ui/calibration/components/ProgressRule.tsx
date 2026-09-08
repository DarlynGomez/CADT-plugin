import styles from "./ProgressRule.module.css";

interface ProgressRuleProps {
  value: number;
  max: number;
}

export function ProgressRule({ value, max }: ProgressRuleProps) {
  return <progress className={styles.progressRule} value={value} max={max} aria-label="Progress" />;
}
