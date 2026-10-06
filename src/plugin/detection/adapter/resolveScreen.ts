export interface ScreenIdentity {
  screenId: string;
  screenName: string;
}

/** Node types that count as a screen boundary */
const SCREEN_CONTAINER_TYPES: ReadonlySet<string> = new Set([
  "FRAME",
  "COMPONENT",
  "COMPONENT_SET",
  "INSTANCE"
]);

/**
 * A screen is the outermost frame, component, component set or instance above the node
 * Groups and sections are skipped, fall back to the nearest section then the node itself
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
