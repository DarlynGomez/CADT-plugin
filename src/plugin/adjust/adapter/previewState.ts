import type { RGBColor } from "../../../shared/issues/issueTypes";
import { solidFill, writeFill } from "./paintWriter";

interface ActivePreview {
  nodeId: string;
  node: TextNode;
  originalFills: Paint[];
}

// Module-level singleton, the same pattern as selectionListener.ts's reEncounterState.
// Holds a live node reference rather than an id so restorePreviewSync can write
// without an async lookup; see startup.ts and ADR-018 for why that matters
let activePreview: ActivePreview | null = null;

/**
 * Writes a candidate colour to node, capturing its original fill first if nothing is
 * currently being previewed on it. Restores any preview active on a DIFFERENT node
 * first, so a stray mutation is never left behind mid session
 *
 * Assumes node.fills is a plain array, never figma.mixed: the only path that reaches
 * this is a finding, and a mixed-fill node never produces one today
 */
export async function beginPreview(node: TextNode, color: RGBColor): Promise<void> {
  if (activePreview && activePreview.nodeId !== node.id) {
    await restorePreview();
  }

  if (!activePreview) {
    const fills = node.fills;
    if (fills === figma.mixed) {
      throw new Error("Cannot preview a node whose fill is mixed");
    }
    activePreview = { nodeId: node.id, node, originalFills: [...fills] };
  }

  await writeFill(node, solidFill(color));
}

/** Restores the active preview's original fill and clears the session, if one exists */
export async function restorePreview(): Promise<void> {
  if (!activePreview) {
    return;
  }
  const { node, originalFills } = activePreview;
  activePreview = null;
  await writeFill(node, originalFills);
}

/**
 * The synchronous twin of restorePreview, for figma.on("close") only: that handler
 * cannot await anything, so this writes directly against the held node reference
 * rather than going through writeFill's range-aware, always-async path
 */
export function restorePreviewSync(): void {
  if (!activePreview) {
    return;
  }
  const { node, originalFills } = activePreview;
  activePreview = null;
  node.fills = originalFills;
}

/**
 * Writes fills for real and forgets any tracked preview on that node, without
 * restoring. Always writes, whether or not a preview was already active, so apply is
 * correct even if it is reached without a prior preview
 *
 * Clears the tracked preview BEFORE writing, not after: the detection loop's own
 * documentchange listener skips a node while activePreviewNodeId() names it (see
 * listeners.ts), specifically so a live preview never gets swept into an accountability
 * rescan before the designer has committed to it. Apply is the moment that changes:
 * clearing first lets this exact write be seen and resolve the issue normally
 */
export async function applyFill(node: TextNode, fills: Paint[]): Promise<void> {
  if (activePreview?.nodeId === node.id) {
    activePreview = null;
  }
  await writeFill(node, fills);
}

export function activePreviewNodeId(): string | null {
  return activePreview?.nodeId ?? null;
}
