import type { RGBColor } from "../../../shared/issues/issueTypes";
import { resolveBoundName } from "./boundName";

export interface PaletteColor {
  color: RGBColor;
  /** The variable or style name this colour is bound to, where it has one */
  name: string | null;
}

function colorKey(color: RGBColor): string {
  return `${color.r.toFixed(4)},${color.g.toFixed(4)},${color.b.toFixed(4)}`;
}

function hasFills(node: SceneNode): node is SceneNode & MinimalFillsMixin {
  return "fills" in node;
}

/**
 * Every distinct solid colour in use anywhere on the current page, each named by its
 * variable or style binding where one exists
 *
 * Scoped to the current page on purpose, not the whole document: this is the same
 * performance tradeoff the initial scan already makes under dynamic-page access, and
 * the option this feeds is explicitly page scoped in its own label
 */
export async function collectFilePalette(): Promise<PaletteColor[]> {
  const nodes = figma.currentPage.findAll(hasFills) as ReadonlyArray<SceneNode & MinimalFillsMixin>;
  const colors = new Map<string, PaletteColor>();

  for (const node of nodes) {
    const fills = node.fills;
    if (fills === figma.mixed) {
      continue;
    }
    for (const fill of fills) {
      if (fill.type !== "SOLID" || fill.visible === false) {
        continue;
      }
      const key = colorKey(fill.color);
      if (colors.has(key)) {
        continue;
      }
      colors.set(key, { color: fill.color, name: await resolveBoundName(node, fill) });
    }
  }

  return Array.from(colors.values());
}
