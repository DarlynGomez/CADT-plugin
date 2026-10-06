import type { RGBColor } from "../../../shared/issues/issueTypes";
import { solidFill, startFillStyleRestore, writeFill, writeFillStyle } from "./paintWriter";

interface ActivePreview {
  nodeIds: ReadonlySet<string>;
  nodes: ReadonlyMap<string, TextNode>;
  originalFills: ReadonlyMap<string, Paint[]>;
  /** Null when the node had no fill style, or a mixed one, which preview never handles */
  originalStyleIds: ReadonlyMap<string, string | null>;
}

function styleIdOf(node: TextNode): string | null {
  const styleId = node.fillStyleId;
  return typeof styleId === "string" && styleId !== "" ? styleId : null;
}

// Holds live nodes so the close handler can restore without an async lookup
let activePreview: ActivePreview | null = null;

function sameNodeSet(a: ReadonlySet<string>, b: readonly TextNode[]): boolean {
  return a.size === b.length && b.every((node) => a.has(node.id));
}

/**
 * Writes a colour to every node and captures each original fill once
 * A different node set restores the old preview first, the same set keeps the true original
 * Also captures the style id because writing fills detaches the style
 */
export async function beginPreview(nodes: readonly TextNode[], color: RGBColor): Promise<void> {
  if (activePreview && !sameNodeSet(activePreview.nodeIds, nodes)) {
    await restorePreview();
  }

  if (!activePreview) {
    const nodeMap = new Map<string, TextNode>();
    const fillMap = new Map<string, Paint[]>();
    const styleMap = new Map<string, string | null>();
    for (const node of nodes) {
      const fills = node.fills;
      if (fills === figma.mixed) {
        throw new Error("Cannot preview a node whose fill is mixed");
      }
      nodeMap.set(node.id, node);
      fillMap.set(node.id, [...fills]);
      styleMap.set(node.id, styleIdOf(node));
    }
    activePreview = {
      nodeIds: new Set(nodeMap.keys()),
      nodes: nodeMap,
      originalFills: fillMap,
      originalStyleIds: styleMap
    };
  }

  await Promise.all(nodes.map((node) => writeFill(node, solidFill(color))));
}

/** Restores every previewed node and clears the session */
export async function restorePreview(): Promise<void> {
  if (!activePreview) {
    return;
  }
  const { nodes, originalFills, originalStyleIds } = activePreview;
  activePreview = null;
  await Promise.all(
    [...nodes.entries()].map(async ([id, node]) => {
      await writeFill(node, originalFills.get(id) as Paint[]);
      const styleId = originalStyleIds.get(id);
      if (styleId) {
        await writeFillStyle(node, styleId);
      }
    })
  );
}

/**
 * Sync version for the close handler, which cannot await
 * Writes straight to the held nodes and starts the style restore
 */
export function restorePreviewSync(): void {
  if (!activePreview) {
    return;
  }
  const { nodes, originalFills, originalStyleIds } = activePreview;
  activePreview = null;
  for (const [id, node] of nodes) {
    node.fills = originalFills.get(id) as Paint[];
    const styleId = originalStyleIds.get(id);
    if (styleId) {
      startFillStyleRestore(node, styleId);
    }
  }
}

/**
 * Writes fills and forgets the tracked preview for this node without restoring
 * Clears the preview first so the change listener sees this write and resolves the issue
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

/** Style id before the preview, null when none or not previewed */
export function originalFillStyleIdFor(nodeId: string): string | null {
  return activePreview?.originalStyleIds.get(nodeId) ?? null;
}

/** The fills a node had before the active preview touched it, or null when it is not previewed */
export function originalFillsFor(nodeId: string): readonly Paint[] | null {
  return activePreview?.originalFills.get(nodeId) ?? null;
}
