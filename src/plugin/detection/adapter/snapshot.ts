import type { NodeSnapshot } from "../../../shared/issues/issueTypes";
import { isBoldStyleName } from "../rules/contrast/textSizeClass";
import { resolveColors } from "../colorResolution";
import { buildAncestorChain } from "./ancestorChain";
import { extractNodeLayer } from "./paintExtraction";

/**
 * The module that assembles a NodeSnapshot. This, ancestorChain.ts, and
 * paintExtraction.ts are the only files that read Figma node properties; nothing
 * downstream of a snapshot touches a Figma type. See CLAUDE.md rule 8 and
 * docs/ENGINEERING_STANDARDS.md section 7.2.
 */
export function snapshotTextNode(node: TextNode): NodeSnapshot {
  const reasons = new Set<string>();

  const fontSize = node.fontSize;
  const fontSizePx = fontSize === figma.mixed ? null : fontSize;
  if (fontSize === figma.mixed) {
    reasons.add("font-size-mixed");
  }

  const fontName = node.fontName;
  let isBold: boolean | null = null;
  if (fontName === figma.mixed) {
    reasons.add("font-name-mixed");
  } else {
    isBold = isBoldStyleName(fontName.style);
  }

  const chain = [extractNodeLayer(node), ...buildAncestorChain(node)];
  const colorResult = resolveColors(chain);
  for (const reason of colorResult.indeterminateReasons) {
    reasons.add(reason);
  }

  return {
    nodeId: node.id,
    nodeName: node.name,
    nodeType: node.type,
    foreground: colorResult.foreground,
    background: colorResult.background,
    fontSizePx,
    isBold,
    indeterminateReasons: Array.from(reasons)
  };
}
