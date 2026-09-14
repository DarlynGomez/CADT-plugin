import type { ChainLayer, PaintLayer } from "../colorResolution";

const NORMAL_BLEND_MODE = "NORMAL";

/** The subset of a node's shape this file ever reads, since not every node has fills */
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
 * Reduce any node encountered while walking the ancestor chain to a plain layer.
 * Nodes with no fills property at all, such as groups, are treated as unpainted so
 * the walk continues through them rather than erroring.
 */
export function extractNodeLayer(node: BaseNode): ChainLayer {
  const partial = node as PartialPaintNode;
  return {
    fill: partial.fills !== undefined ? classifyFill(partial.fills) : { kind: "empty" },
    nodeOpacity: partial.opacity ?? 1,
    blendMode: partial.blendMode ?? NORMAL_BLEND_MODE,
    visible: partial.visible ?? true
  };
}

/** The page background is the walk's final fallback and reads `backgrounds`, not `fills` */
export function extractPageBackgroundLayer(page: PageNode): ChainLayer {
  return {
    fill: classifyFill(page.backgrounds),
    nodeOpacity: 1,
    blendMode: NORMAL_BLEND_MODE,
    visible: true
  };
}
