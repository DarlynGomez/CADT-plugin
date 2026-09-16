import type { RGBColor } from "../../../shared/issues/issueTypes";

export interface FillRange {
  start: number;
  end: number;
}

/** A single solid fill at full opacity, the only shape this feature ever writes */
export function solidFill(color: RGBColor): Paint[] {
  return [{ type: "SOLID", color, opacity: 1 }];
}

/**
 * The only function in the codebase that writes a node's fill. Preview, restore, and
 * apply all call this, since from Figma's point of view they are the same operation:
 * replace this fill, nothing else. See ADR-017 for exactly which writes are permitted
 *
 * A range writes per styled text segment rather than replacing the whole node's fill,
 * for mixed-fill text; the font in that range must be loaded first. Omitting range
 * writes the whole node, which is the only path any current finding can reach, since
 * a mixed-fill node never produces a finding today
 */
export async function writeFill(node: TextNode, fills: Paint[], range?: FillRange): Promise<void> {
  if (!range) {
    node.fills = fills;
    return;
  }

  const fontName = node.getRangeFontName(range.start, range.end);
  if (fontName !== figma.mixed) {
    await figma.loadFontAsync(fontName);
  }
  node.setRangeFills(range.start, range.end, fills);
}
