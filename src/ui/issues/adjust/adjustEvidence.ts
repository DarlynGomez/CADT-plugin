// Mirrors IssueCard.tsx's own describeEvidence: a local, narrowed view rather than
// importing the plugin-side ContrastEvidence type, since the UI cannot import from the
// plugin sandbox. See ADR-016 on why evidence stays generic at the shared spine

export interface ContrastEvidenceView {
  foregroundHex: string;
  backgroundHex: string;
  requiredRatio: number;
  measuredRatio: number;
}

export function readContrastEvidence(ruleId: string, evidence: unknown): ContrastEvidenceView | null {
  if (ruleId !== "contrast" || !evidence || typeof evidence !== "object") {
    return null;
  }
  const fields = evidence as Record<string, unknown>;
  if (
    typeof fields.foregroundHex !== "string" ||
    typeof fields.backgroundHex !== "string" ||
    typeof fields.requiredRatio !== "number" ||
    typeof fields.measuredRatio !== "number"
  ) {
    return null;
  }
  return {
    foregroundHex: fields.foregroundHex,
    backgroundHex: fields.backgroundHex,
    requiredRatio: fields.requiredRatio,
    measuredRatio: fields.measuredRatio
  };
}
