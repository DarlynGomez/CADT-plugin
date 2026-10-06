import type { RGBColor } from "../../../shared/issues/issueTypes";

export interface FillRange {
  start: number;
  end: number;
}

/** A single solid fill at full opacity, the only shape this feature ever writes */
export function solidFill(color: RGBColor): Paint[] {
  return [{ type: "SOLID", color, opacity: 1 }];
}


/** Re-applies a fill style a preview detached */

export async function writeFillStyle(node: TextNode, styleId: string): Promise<void> {
  await node.setFillStyleIdAsync(styleId);
}

export function startFillStyleRestore(node: TextNode, styleId: string): void {
  node.setFillStyleIdAsync(styleId).catch((error: unknown) => {
    console.error("startFillStyleRestore: could not re-apply the fill style", error);
  });
}


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
