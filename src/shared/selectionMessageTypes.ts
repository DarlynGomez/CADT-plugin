/**
 * GROUPING_SPEC.md section 5.1: native selection and viewport control only, nothing is
 * written. Kept apart from rootMessageTypes.ts, which is state-changing group actions;
 * these two never persist anything.
 */
export interface ShowOnCanvasMessage {
  type: "SHOW_ON_CANVAS";
  nodeIds: string[];
}

/** Restores whatever the sandbox has stored as the designer's own last selection */
export interface RestoreSelectionMessage {
  type: "RESTORE_SELECTION";
}

export type SelectionMessage = ShowOnCanvasMessage | RestoreSelectionMessage;
