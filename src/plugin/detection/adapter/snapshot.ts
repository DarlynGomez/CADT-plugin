import type { NodeSnapshot } from "../../../shared/issues/issueTypes";
import { isBoldStyleName } from "../rules/contrast/textSizeClass";
import { BOLD_MIN_FONT_WEIGHT } from "../rules/contrast/thresholds";
import { resolveColors } from "../colorResolution";
import { buildAncestorChain } from "./ancestorChain";
import { extractNodeLayer } from "./paintExtraction";
import { resolveForegroundBinding } from "./resolveBinding";
import { resolveScreen } from "./resolveScreen";

/**
 * The module that assembles a NodeSnapshot. This, ancestorChain.ts, paintExtraction.ts,
 * resolveScreen.ts, and resolveBinding.ts are the only files that read Figma node
 * properties; nothing downstream of a snapshot touches a Figma type. See CLAUDE.md rule
 * 8 and docs/ENGINEERING_STANDARDS.md section 7.2.
 *
 * Async only because resolveForegroundBinding is: a variable or style lookup needs an
 * await, unlike every other field here, which reads synchronously off the node itself
 */
export async function snapshotTextNode(node: TextNode): Promise<NodeSnapshot> {
  const reasons = new Set<string>();

  const fontSize = node.fontSize;
  const fontSizePx = fontSize === figma.mixed ? null : fontSize;
  if (fontSize === figma.mixed) {
    reasons.add("font-size-mixed");
  }

  const fontName = node.fontName;
  const fontStyleName = fontName === figma.mixed ? null : fontName.style;
  const isBold = resolveIsBold(node, fontName, reasons);

  const chain = [extractNodeLayer(node), ...buildAncestorChain(node)];
  const colorResult = resolveColors(chain);
  for (const reason of colorResult.indeterminateReasons) {
    reasons.add(reason);
  }

  const screen = resolveScreen(node);
  const foregroundBinding = await resolveForegroundBinding(node);

  return {
    nodeId: node.id,
    nodeName: node.name,
    nodeType: node.type,
    screenId: screen.screenId,
    screenName: screen.screenName,
    foregroundBinding,
    foreground: colorResult.foreground,
    foregroundAlpha: colorResult.foregroundAlpha,
    background: colorResult.background,
    backgroundAlpha: colorResult.backgroundAlpha,
    backgroundSource: colorResult.backgroundSource,
    fontSizePx,
    isBold,
    fontStyleName,
    indeterminateReasons: Array.from(reasons)
  };
}

/**
 * Prefers the numeric fontWeight, since it is exact where a style name is a guess
 *
 * The fontName.style fallback is likely unreachable in real Figma data: per the
 * typings, fontName and fontWeight go mixed under the same conditions, so a resolved
 * fontName should never pair with a mixed fontWeight
 *
 * Kept anyway as a hedge: this is inferred from docs, not verified live, and wrongly
 * nulling a bold call is worse than one extra branch
 */
function resolveIsBold(
  node: TextNode,
  fontName: TextNode["fontName"],
  reasons: Set<string>
): boolean | null {
  const fontWeight = node.fontWeight;
  if (fontWeight !== figma.mixed) {
    return fontWeight >= BOLD_MIN_FONT_WEIGHT;
  }

  if (fontName === figma.mixed) {
    reasons.add("font-name-mixed");
    return null;
  }
  return isBoldStyleName(fontName.style);
}
