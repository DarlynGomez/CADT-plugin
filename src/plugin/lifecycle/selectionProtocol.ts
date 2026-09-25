import type { SelectionMessage } from "../../shared/selectionMessageTypes";
import {
  getStoredSelectionToRestore,
  restoreSelection,
  selectAndZoomToFit
} from "../accountability/adapter/canvasSelection";

export function isSelectionMessage(value: unknown): value is SelectionMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const message = value as Record<string, unknown>;
  if (message.type === "SHOW_ON_CANVAS") {
    return Array.isArray(message.nodeIds) && message.nodeIds.every((id) => typeof id === "string");
  }
  return message.type === "RESTORE_SELECTION";
}

/**
 * GROUPING_SPEC.md section 5.1: native selection and viewport control only, nothing is
 * written, and neither message ever replies. The panel already knows what it asked for,
 * "showing N layers" is client-side bookkeeping, not something the sandbox confirms.
 */
export async function handleSelectionMessage(message: SelectionMessage): Promise<void> {
  if (message.type === "SHOW_ON_CANVAS") {
    await selectAndZoomToFit(message.nodeIds);
    return;
  }
  await restoreSelection(getStoredSelectionToRestore());
}
