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
 * The severity word as a coloured pill. Colour is supplementary: the word itself
 * ("High Severity") is what actually conveys severity, matching GROUPING_SPEC.md
 * section 11's "never colour alone," so this reads the same in grayscale.
 */
export function SeverityTag({ severity }: SeverityTagProps) {
  return <span className={`${styles.tag} ${styles[severity]}`}>{TEXT[severity]}</span>;
}
