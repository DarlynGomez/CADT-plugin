import type { RGBColor } from "../../../shared/issues/issueTypes";
import { solidFill, writeFill } from "./paintWriter";

interface ActivePreview {
  nodeIds: ReadonlySet<string>;
  nodes: ReadonlyMap<string, TextNode>;
  originalFills: ReadonlyMap<string, Paint[]>;
}

// Module-level singleton, the same pattern as selectionListener.ts's reEncounterState.
// Holds live node references rather than ids so restorePreviewSync can write without
// an async lookup; see startup.ts and ADR-018 for why that matters
let activePreview: ActivePreview | null = null;

function sameNodeSet(a: ReadonlySet<string>, b: readonly TextNode[]): boolean {
  return a.size === b.length && b.every((node) => a.has(node.id));
}

/**
 * Writes a candidate colour to every node, capturing each original fill once. Restores
 * a preview active on a DIFFERENT set of nodes first, so a stray mutation is never left
 * behind mid session. Previewing the same set again, for example a new colour from the
 * wheel, does not re-capture: restoring always returns to the true original
 *
 * Assumes node.fills is a plain array, never figma.mixed, on every node: the only path
 * that reaches this is a finding, and a mixed-fill node never produces one today
 */
export async function beginPreview(nodes: readonly TextNode[], color: RGBColor): Promise<void> {
  if (activePreview && !sameNodeSet(activePreview.nodeIds, nodes)) {
    await restorePreview();
  }

  if (!activePreview) {
    const nodeMap = new Map<string, TextNode>();
    const fillMap = new Map<string, Paint[]>();
    for (const node of nodes) {
      const fills = node.fills;
      if (fills === figma.mixed) {
        throw new Error("Cannot preview a node whose fill is mixed");
      }
      nodeMap.set(node.id, node);
      fillMap.set(node.id, [...fills]);
    }
    activePreview = { nodeIds: new Set(nodeMap.keys()), nodes: nodeMap, originalFills: fillMap };
  }

  await Promise.all(nodes.map((node) => writeFill(node, solidFill(color))));
}

/** Restores every previewed node's original fill and clears the session, if one exists */
export async function restorePreview(): Promise<void> {
  if (!activePreview) {
    return;
  }
  const { nodes, originalFills } = activePreview;
  activePreview = null;
  await Promise.all(
    [...nodes.entries()].map(([id, node]) => writeFill(node, originalFills.get(id) as Paint[]))
  );
}

/**
 * The synchronous twin of restorePreview, for figma.on("close") only: that handler
 * cannot await anything, so this writes directly against the held node references
 * rather than going through writeFill's range-aware, always-async path. Restores every
 * previewed node, not just one
 */
export function restorePreviewSync(): void {
  if (!activePreview) {
    return;
  }
  const { nodes, originalFills } = activePreview;
  activePreview = null;
  for (const [id, node] of nodes) {
    node.fills = originalFills.get(id) as Paint[];
  }
}

/**
 * Writes fills for real and forgets any tracked preview covering this node, without
 * restoring. Always writes, whether or not a preview was already active, so apply is
 * correct even if it is reached without a prior preview.
 *
 * Clears the whole tracked preview when this node is part of it, before writing, not
 * after: the detection loop's own documentchange listener skips a node while
 * activePreviewNodeIds() names it (see listeners.ts), specifically so a live preview
 * never gets swept into an accountability rescan before the designer has committed to
 * it. Apply is the moment that changes: clearing first lets this exact write be seen
 * and resolve the issue normally. A future group apply, phase 21 or later, commits
 * every previewed node in one pass rather than calling this once per node
 */
export async function applyFill(node: TextNode, fills: Paint[]): Promise<void> {
  if (activePreview?.nodeIds.has(node.id)) {
    activePreview = null;
  }
  await writeFill(node, fills);
}

export function activePreviewNodeIds(): ReadonlySet<string> {
  return activePreview?.nodeIds ?? new Set();
}
