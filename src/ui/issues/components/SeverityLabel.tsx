import type { Severity } from "../../../shared/issues/issueTypes";
import styles from "./SeverityLabel.module.css";

const SEVERITY_TEXT: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

interface SeverityLabelProps {
  severity: Severity;
}

/** Severity conveyed as text, never by color alone, so it survives grayscale and reduced motion */
export function SeverityLabel({ severity }: SeverityLabelProps) {
  return <span className={`${styles.label} ${styles[severity]}`}>{SEVERITY_TEXT[severity]}</span>;
}
