import type { IssueState, Severity } from "../issues/issueTypes";

/**
 * The plain-data shape grouping needs from one instance: enough of Issue and the
 * contrast evidence to build a signature, derive state, and pick a representative.
 * Deliberately not wired to the real Issue and ContrastEvidence shapes yet: phase 21
 * assembles this from them once the snapshot adapter carries a foreground binding and a
 * screen name, neither of which it produces today. See docs/GROUPING_SPEC.md section 3.
 */
export interface GroupableFinding {
  issueId: string;
  nodeId: string;
  nodeName: string;
  screenName: string;
  state: IssueState;
  severity: Severity;
  measuredRatio: number;
  requiredRatio: number;
  foregroundHex: string;
  backgroundHex: string;
  /** null means unbound. Part of the root signature. See ADR-019. */
  foregroundBinding: string | null;
  /** null means unbound. Never part of the signature, shown in Details only. See ADR-019. */
  backgroundBinding: string | null;
  /** Position in the order the snapshot adapter emitted this instance. See spec section 3.5. */
  documentOrder: number;
}

/** Spec section 3.2's four displayed states. "decided" stands in for "moved to Decisions view". */
export type RootDisplayState = "important" | "open" | "deferred" | "decided";

/** How many of a root's instances sit in each real IssueState, for the mixed-root breakdown */
export type RootStateBreakdown = Readonly<Partial<Record<IssueState, number>>>;

/** A root: a pure computed view over its instances. Nothing here is ever persisted. See ADR-019. */
export interface Root {
  signature: string;
  foregroundHex: string;
  backgroundHex: string;
  foregroundBinding: string | null;
  requiredRatio: number;
  instances: readonly GroupableFinding[];
  /** issueId of the representative instance. See spec section 3.5. */
  representativeIssueId: string;
  /** The distinct background bindings this root's instances carry, for the Details disclosure */
  backgroundBindings: readonly string[];
  displayState: RootDisplayState;
  stateBreakdown: RootStateBreakdown;
}

/**
 * Spec section 3.4's stored record: one per signature, under cadt.decisions.v1. The
 * store that reads and writes this (decisionStore.ts) is phase 21; this type is the
 * plain-data contract between it and the pure matching function below.
 */
export interface RootDecision {
  signature: string;
  reason: string;
  recordedAt: string;
  severityAtDecision: Severity;
}

export type DecisionMatch =
  | { offered: true; decision: RootDecision }
  | { offered: false; decision: RootDecision; reason: "worse-severity" }
  | { offered: false; decision: null; reason: "no-match" };
