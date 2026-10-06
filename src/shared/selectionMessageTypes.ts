/** Selection and zoom only, nothing is written to the file */
export interface ShowOnCanvasMessage {
  type: "SHOW_ON_CANVAS";
  nodeIds: string[];
}

/** Puts back the selection the designer had before */
export interface RestoreSelectionMessage {
  type: "RESTORE_SELECTION";
}

export type SelectionMessage = ShowOnCanvasMessage | RestoreSelectionMessage;
