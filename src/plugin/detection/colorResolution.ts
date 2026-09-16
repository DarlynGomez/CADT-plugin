import type { BackgroundSource, RGBColor } from "../../shared/issues/issueTypes";

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
  /** This layer's identity, carried through so a resolved background can name its source */
  source: BackgroundSource;
}

export interface ColorResolutionResult {
  foreground: RGBColor | null;
  foregroundAlpha: number | null;
  background: RGBColor | null;
  backgroundAlpha: number | null;
  backgroundSource: BackgroundSource | null;
  indeterminateReasons: readonly string[];
}

interface ResolvedFill {
  color: RGBColor;
  alpha: number;
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

/** Resolve one layer's own fill to a color and its alpha, recording why it could not stand as one */
function resolveFill(fill: PaintLayer | "mixed", reasons: Set<string>): ResolvedFill | null {
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
  return { color: fill.color, alpha: fill.opacity };
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
    return {
      foreground: null,
      foregroundAlpha: null,
      background: null,
      backgroundAlpha: null,
      backgroundSource: null,
      indeterminateReasons: ["missing-node-data"]
    };
  }

  const reasons = new Set<string>();
  checkLayerValidity(textLayer, reasons);
  const resolvedForeground = resolveFill(textLayer.fill, reasons);
  if (resolvedForeground === null && textLayer.fill !== "mixed" && textLayer.fill.kind === "empty") {
    reasons.add("no-foreground-fill");
  }

  let resolvedBackground: ResolvedFill | null = null;
  let backgroundSource: BackgroundSource | null = null;
  for (const layer of ancestors) {
    checkLayerValidity(layer, reasons);
    if (layer.fill !== "mixed" && layer.fill.kind === "empty") {
      continue;
    }
    resolvedBackground = resolveFill(layer.fill, reasons);
    backgroundSource = layer.source;
    break;
  }
  if (resolvedBackground === null) {
    reasons.add("no-background-resolved");
  }

  if (reasons.size > 0 || resolvedForeground === null || resolvedBackground === null) {
    return {
      foreground: null,
      foregroundAlpha: null,
      background: null,
      backgroundAlpha: null,
      backgroundSource: null,
      indeterminateReasons: Array.from(reasons)
    };
  }
  return {
    foreground: resolvedForeground.color,
    foregroundAlpha: resolvedForeground.alpha,
    background: resolvedBackground.color,
    backgroundAlpha: resolvedBackground.alpha,
    backgroundSource,
    indeterminateReasons: []
  };
}
