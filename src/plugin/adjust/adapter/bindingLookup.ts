import { resolveBoundName } from "./boundName";

export interface FillBinding {
  name: string;
  /** How many other text nodes on the current page carry the same binding */
  usageCount: number;
}

/** Also used by the signature lookup in detection */
export function firstSolidFill(node: TextNode): SolidPaint | null {
  const fills = node.fills;
  if (fills === figma.mixed) {
    return null;
  }
  return fills.find((fill): fill is SolidPaint => fill.type === "SOLID") ?? null;
}

function sharesBinding(candidate: TextNode, variableId: string | undefined, styleId: string | typeof figma.mixed): boolean {
  const candidateFill = firstSolidFill(candidate);
  if (variableId) {
    return candidateFill?.boundVariables?.color?.id === variableId;
  }
  return candidate.fillStyleId === styleId;
}

/**
 * Whether the fill is bound, and how many other text nodes on the page share the binding
 * Page scoped on purpose, a whole document count means walking every page
 */
export async function detectFillBinding(node: TextNode): Promise<FillBinding | null> {
  const fill = firstSolidFill(node);
  if (!fill) {
    return null;
  }

  const name = await resolveBoundName(node, fill);
  if (!name) {
    return null;
  }

  const variableId = fill.boundVariables?.color?.id;
  const styleId = node.fillStyleId;
  const others = figma.currentPage.findAllWithCriteria({ types: ["TEXT"] }) as TextNode[];
  const usageCount = others.filter(
    (candidate) => candidate.id !== node.id && sharesBinding(candidate, variableId, styleId)
  ).length;

  return { name, usageCount };
}
