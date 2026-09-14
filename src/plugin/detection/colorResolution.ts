import type { RGBColor } from "../../shared/issues/issueTypes";

/** One node's paint, reduced to what resolution needs. No Figma type appears here. */
export type PaintLayer =
  | { kind: "solid"; color: RGBColor; opacity: number }
  | { kind: "unresolvable" } // a gradient, image, or video: opaque, but not a single color
  | { kind: "empty" }; // no paint at all; the walk continues past it

/** One node in the chain from the text node itself up through its ancestors to the page */
export interface ChainLayer {
  fill: PaintLayer | "mixed";
  nodeOpacity: number;
  blendMode: string;
  visible: boolean;
}

export interface ColorResolutionResult {
  foreground: RGBColor | null;
  background: RGBColor | null;
  indeterminateReasons: readonly string[];
}

/**
 * Blend modes that do not alter how a layer composites with what is behind it, so they
 * are not indeterminate. Figma's own default for a frame or group is "PASS_THROUGH",
 * not "NORMAL": it means the container applies no blending of its own and its children
 * composite straight through. Treating that as indeterminate would flag nearly every
 * ordinary frame in a real file, which is exactly the bug this comment is here to keep
 * from coming back.
 */
const NON_BLOCKING_BLEND_MODES = new Set(["NORMAL", "PASS_THROUGH"]);

function checkLayerValidity(layer: ChainLayer, reasons: Set<string>): void {
  if (!layer.visible) {
    reasons.add("node-invisible");
  }
  if (layer.nodeOpacity < 1) {
    reasons.add("opacity-below-one");
  }
  if (!NON_BLOCKING_BLEND_MODES.has(layer.blendMode)) {
    reasons.add("blend-mode");
  }
}

/** Resolve one layer's own fill to a color, recording why it could not stand as one */
function resolveFill(fill: PaintLayer | "mixed", reasons: Set<string>): RGBColor | null {
  if (fill === "mixed") {
    reasons.add("fill-mixed");
    return null;
  }
  if (fill.kind === "unresolvable") {
    reasons.add("fill-unresolvable");
    return null;
  }
  if (fill.kind === "empty") {
    return null;
  }
  if (fill.opacity < 1) {
    reasons.add("opacity-below-one");
  }
  return fill.color;
}

/**
 * Resolve foreground and background from a plain chain the adapter has already
 * extracted, so this function never touches a Figma type. chain[0] is the text node
 * itself; the rest are ancestors in order, ending with the page background as the
 * final fallback. Never guesses: any indeterminate reason blanks both colors.
 */
export function resolveColors(chain: readonly ChainLayer[]): ColorResolutionResult {
  const [textLayer, ...ancestors] = chain;
  if (!textLayer) {
    return { foreground: null, background: null, indeterminateReasons: ["missing-node-data"] };
  }

  const reasons = new Set<string>();
  checkLayerValidity(textLayer, reasons);
  const foreground = resolveFill(textLayer.fill, reasons);
  if (foreground === null && textLayer.fill !== "mixed" && textLayer.fill.kind === "empty") {
    reasons.add("no-foreground-fill");
  }

  let background: RGBColor | null = null;
  for (const layer of ancestors) {
    checkLayerValidity(layer, reasons);
    if (layer.fill !== "mixed" && layer.fill.kind === "empty") {
      continue;
    }
    background = resolveFill(layer.fill, reasons);
    break;
  }
  if (background === null) {
    reasons.add("no-background-resolved");
  }

  if (reasons.size > 0) {
    return { foreground: null, background: null, indeterminateReasons: Array.from(reasons) };
  }
  return { foreground, background, indeterminateReasons: [] };
}
