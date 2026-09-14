/** How far a finding falls short of its required contrast, banded for display and fading */
export type Severity = "low" | "medium" | "high";

/** A color in the 0 to 1 range per channel, matching Figma's own Paint.color shape */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * A node reduced to what detection rules need. Produced only by the snapshot adapter,
 * never by anything that reads a Figma node directly. A null color, size, or weight
 * means it could not be resolved; indeterminateReasons says why and a rule must treat
 * that as no finding rather than guessing.
 */
export interface NodeSnapshot {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  foreground: RGBColor | null;
  background: RGBColor | null;
  fontSizePx: number | null;
  isBold: boolean | null;
  indeterminateReasons: readonly string[];
}

/**
 * One rule's verdict on one node: only produced when the rule found a real problem.
 * The spine (ruleId, nodeId, severity) is generic across every rule; evidence is
 * whatever that specific rule needs to justify and later display the finding. See
 * ADR-016: this stays generic on purpose, even with only one rule registered, so the
 * shape does not have to change under pressure the moment a second rule arrives.
 */
export interface Finding<TEvidence = unknown> {
  ruleId: string;
  nodeId: string;
  severity: Severity;
  evidence: TEvidence;
}
