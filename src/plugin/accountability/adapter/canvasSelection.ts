/**
 * The only module that writes figma.currentPage.selection. GROUPING_SPEC.md section
 * 5.2: every selection this module sets is marked, so re-encounter, and phase 25's
 * current-screen tracking once it exists, can tell it apart from the designer's own.
 * Module-level singleton state, the same pattern previewState.ts already uses
 */
let pluginSetSelectionPending = false;

/** Design storage for GROUPING_SPEC.md 5.1: only ever set from a designer-originated change */
let lastDesignerSelection: readonly string[] = [];

/**
 * Reads and clears the marker in one step. Call exactly once per selectionchange
 * event, from the single registered listener in selectionListener.ts; a second,
 * independent reader must receive the same boolean as a parameter from that call
 * rather than reading this again, since a second read always sees false
 */
export function consumePluginSetSelectionMarker(): boolean {
  const wasPluginSet = pluginSetSelectionPending;
  pluginSetSelectionPending = false;
  return wasPluginSet;
}

/** GROUPING_SPEC.md 5.1: only a selection the designer made themselves is ever storable */
export function recordDesignerSelection(nodeIds: readonly string[]): void {
  lastDesignerSelection = nodeIds;
}

export function getStoredSelectionToRestore(): readonly string[] {
  return lastDesignerSelection;
}

async function resolveSceneNodes(nodeIds: readonly string[]): Promise<SceneNode[]> {
  const nodes = await Promise.all(nodeIds.map((id) => figma.getNodeByIdAsync(id)));
  return nodes.filter(
    (node): node is SceneNode => node !== null && node.type !== "DOCUMENT" && node.type !== "PAGE"
  );
}

function applySelection(nodes: readonly SceneNode[]): void {
  pluginSetSelectionPending = true;
  figma.currentPage.selection = [...nodes];
}

/**
 * Selects already-resolved nodes and zooms to fit. For a caller that already holds
 * live node references, such as issuesProtocol.ts's focusIssue, avoiding a redundant
 * lookup through selectAndZoomToFit
 */
export function selectResolvedNodesAndZoom(nodes: readonly SceneNode[]): void {
  applySelection(nodes);
  figma.viewport.scrollAndZoomIntoView([...nodes]);
}

/** GROUPING_SPEC.md 5.1: "Show on canvas". Resolves nodeIds, selects them, zooms to fit */
export async function selectAndZoomToFit(nodeIds: readonly string[]): Promise<SceneNode[]> {
  const nodes = await resolveSceneNodes(nodeIds);
  selectResolvedNodesAndZoom(nodes);
  return nodes;
}

/** GROUPING_SPEC.md 5.1's Restore control: selects without zooming */
export async function restoreSelection(nodeIds: readonly string[]): Promise<void> {
  const nodes = await resolveSceneNodes(nodeIds);
  applySelection(nodes);
}
