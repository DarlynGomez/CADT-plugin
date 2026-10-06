/** Marks plugin made selections so they are not mistaken for the designer selecting */
let pluginSetSelectionPending = false;

/** Only set from a change the designer made */
let lastDesignerSelection: readonly string[] = [];

/** Reads and clears the marker, call once per selection change and pass the result on */
export function consumePluginSetSelectionMarker(): boolean {
  const wasPluginSet = pluginSetSelectionPending;
  pluginSetSelectionPending = false;
  return wasPluginSet;
}

/** Only selections made by the designer are stored */
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

/** Selects nodes already in hand and zooms to fit, skips a lookup by id */
export function selectResolvedNodesAndZoom(nodes: readonly SceneNode[]): void {
  applySelection(nodes);
  figma.viewport.scrollAndZoomIntoView([...nodes]);
}

/** Selects the nodes by id and zooms to fit */
export async function selectAndZoomToFit(nodeIds: readonly string[]): Promise<SceneNode[]> {
  const nodes = await resolveSceneNodes(nodeIds);
  selectResolvedNodesAndZoom(nodes);
  return nodes;
}

/** Selects without zooming */
export async function restoreSelection(nodeIds: readonly string[]): Promise<void> {
  const nodes = await resolveSceneNodes(nodeIds);
  applySelection(nodes);
}
