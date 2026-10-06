import type { Severity } from "../../../shared/issues/issueTypes";
import styles from "./SeverityTag.module.css";

const TEXT: Record<Severity, string> = {
  high: "High Severity",
  medium: "Medium Severity",
  low: "Low Severity"
};

interface SeverityTagProps {
  severity: Severity;
}

/**
 * The severity word as a coloured pill
 * The word carries the meaning so it reads the same in grayscale
 */
export function SeverityTag({ severity }: SeverityTagProps) {
  return <span className={`${styles.tag} ${styles[severity]}`}>{TEXT[severity]}</span>;
}
