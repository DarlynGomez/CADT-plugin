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

/** The five states from spec section 5. Four are designer-controlled, one is a consequence. */
export type IssueState = "open" | "deferred" | "acknowledged" | "important" | "resolved";

/**
 * The persisted record for one rule applied to one node, keyed by id in issueStore.ts
 * under cadt.issues.v1. See ADR-011: file-scoped by nature, unlike calibration.
 *
 * waitingForSelectionToLeave, the immediate-resurface guard from spec section 5.3, is
 * deliberately absent here: it is runtime-only session state owned by reEncounter.ts,
 * not persisted, since persisting it would suppress a legitimate re-encounter after the
 * plugin is closed and reopened with the node still selected.
 */
export interface Issue {
  id: string;
  ruleId: string;
  nodeId: string;
  state: IssueState;
  severityAtLastDetection: Severity;
  encounterCount: number;
  lastDetectedAt: string;
  acknowledgedReason?: string;
  acknowledgedAt?: string;
  severityAtAcknowledgment?: Severity;
  /** Set when a worse-than-acknowledged finding reopened this issue. See ADR-014. */
  changedSinceAcknowledgment?: boolean;
}

/**
 * What the panel needs beyond the persisted record: the node's current name and the
 * rule's current evidence, for example contrast's measured and required ratio.
 * Deliberately not part of Issue and not persisted; both are recomputed live when the
 * sandbox builds this message, so the panel never shows a stale number. evidence stays
 * unknown here for the same reason Finding's does: see ADR-016.
 */
export interface IssueSummary extends Issue {
  nodeName: string;
  evidence?: unknown;
}
