/** GROUPING_SPEC.md 3.3: every open instance in the root becomes deferred */
export interface RootDeferMessage {
  type: "ROOT_DEFER";
  issueIds: string[];
}

/** GROUPING_SPEC.md 3.3: every instance becomes important */
export interface RootMarkImportantMessage {
  type: "ROOT_MARK_IMPORTANT";
  issueIds: string[];
}

/** GROUPING_SPEC.md 3.3: only the currently important instances return to open */
export interface RootUnmarkImportantMessage {
  type: "ROOT_UNMARK_IMPORTANT";
  issueIds: string[];
}

/**
 * GROUPING_SPEC.md 3.3 and 3.4: one reason applied to every included instance, and
 * recorded as a decision under the given signature. fromDecisionOffer distinguishes
 * accepting a matching-decision offer from typing a fresh reason, for section 12's
 * logging once that exists; it carries no other behaviour.
 */
export interface RootIgnoreMessage {
  type: "ROOT_IGNORE";
  issueIds: string[];
  reason: string;
  signature: string;
  fromDecisionOffer: boolean;
}

/**
 * Section 6.5's Decisions-view Reopen control, and the Ignored tray's Restore: only
 * ignored instances return to open. `clearDecision` is true exactly when this reopen
 * leaves no ignored instance of `signature` behind, a full-root restore; the recorded
 * decision is cleared then, since leaving it would immediately re-offer itself to the
 * very root the designer just brought back, not the "new matching instance" case
 * ADR-022 built the offer for. A partial restore, some instances checked in the
 * Ignored tray's disclosure but not others, leaves the decision alone: it still
 * describes the instances still ignored. See ADR-032.
 */
export interface RootReopenMessage {
  type: "ROOT_REOPEN";
  issueIds: string[];
  signature: string;
  clearDecision: boolean;
}

/** The deferred card's restore control: only deferred instances return to open */
export interface RootRestoreDeferredMessage {
  type: "ROOT_RESTORE_DEFERRED";
  issueIds: string[];
}

/** Every inbound group-action message the accountability panel sends */
export type RootMessage =
  | RootDeferMessage
  | RootMarkImportantMessage
  | RootUnmarkImportantMessage
  | RootIgnoreMessage
  | RootReopenMessage
  | RootRestoreDeferredMessage;

/** A group action was rejected; message explains why for display, not just logging */
export interface RootActionFailedMessage {
  type: "ROOT_ACTION_FAILED";
  issueIds: readonly string[];
  message: string;
}
