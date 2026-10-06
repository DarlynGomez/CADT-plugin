import type { ChainLayer, PaintLayer } from "../colorResolution";

const NORMAL_BLEND_MODE = "NORMAL";

/** The part of a node this file reads, not every node has fills */
interface PartialPaintNode {
  fills?: ReadonlyArray<Paint> | typeof figma.mixed;
  opacity?: number;
  blendMode?: BlendMode;
  visible?: boolean;
}

function classifyFill(fills: ReadonlyArray<Paint> | typeof figma.mixed): PaintLayer | "mixed" {
  if (fills === figma.mixed) {
    return "mixed";
  }
  const visible = fills.find((fill) => fill.visible !== false);
  if (!visible) {
    return { kind: "empty" };
  }
  if (visible.type !== "SOLID") {
    return { kind: "unresolvable" };
  }
  return {
    kind: "solid",
    color: { r: visible.color.r, g: visible.color.g, b: visible.color.b },
    opacity: visible.opacity ?? 1
  };
}

/**
 * Reduces any node in the ancestor walk to a plain layer
 * Nodes without fills such as groups count as unpainted so the walk continues
 */
export function extractNodeLayer(node: BaseNode): ChainLayer {
  const partial = node as PartialPaintNode;
  return {
    fill: partial.fills !== undefined ? classifyFill(partial.fills) : { kind: "empty" },
    nodeOpacity: partial.opacity ?? 1,
    blendMode: partial.blendMode ?? NORMAL_BLEND_MODE,
    visible: partial.visible ?? true,
    source: { kind: "node", nodeId: node.id, nodeName: node.name }
  };
}

/** The page background is the final fallback and is read from backgrounds not fills */
export function extractPageBackgroundLayer(page: PageNode): ChainLayer {
  return {
    fill: classifyFill(page.backgrounds),
    nodeOpacity: 1,
    blendMode: NORMAL_BLEND_MODE,
    visible: true,
    source: { kind: "page" }
  };
}
