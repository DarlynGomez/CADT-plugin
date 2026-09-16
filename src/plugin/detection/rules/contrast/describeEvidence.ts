import type { ContrastEvidence } from "./contrastRule";
import type { Severity } from "../../../../shared/issues/issueTypes";

/** One line per finding: foreground, background, ratio, and severity, for fast scanning */
export function describeContrastEvidence(evidence: ContrastEvidence, severity: Severity): string {
  return (
    `fg=${evidence.foregroundHex} bg=${evidence.backgroundHex} ` +
    `ratio=${evidence.measuredRatio.toFixed(2)}:1 (needs ${evidence.requiredRatio.toFixed(1)}:1) ` +
    `severity=${severity}`
  );
}
