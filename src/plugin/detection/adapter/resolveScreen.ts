export interface ScreenIdentity {
  screenId: string;
  screenName: string;
}

/** MARKERS_SPEC.md section 5.1: the node types that count as a screen boundary */
const SCREEN_CONTAINER_TYPES: ReadonlySet<string> = new Set([
  "FRAME",
  "COMPONENT",
  "COMPONENT_SET",
  "INSTANCE"
]);

/**
 * MARKERS_SPEC.md section 5.1: a node's screen is its outermost frame, component,
 * component set, or instance ancestor, groups and sections transparent to the walk,
 * falling back to the nearest section and then to the node itself
 */
export function resolveScreen(node: SceneNode): ScreenIdentity {
  let outermostContainer: { id: string; name: string } | null = null;
  let nearestSection: { id: string; name: string } | null = null;

  let current: BaseNode | null = node.parent;
  while (current && current.type !== "PAGE") {
    if (SCREEN_CONTAINER_TYPES.has(current.type)) {
      outermostContainer = current;
    } else if (current.type === "SECTION" && nearestSection === null) {
      nearestSection = current;
    }
    current = current.parent;
  }

  const screen = outermostContainer ?? nearestSection ?? node;
  return { screenId: screen.id, screenName: screen.name };
}
