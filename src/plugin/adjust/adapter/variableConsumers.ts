import { firstSolidFill } from "./bindingLookup";

/**
 * Every text node on the current page whose fill is bound to this exact variable.
 * Page scoped, the same performance tradeoff filePalette.ts and bindingLookup.ts
 * already make under dynamic-page access.
 */
export function findVariableConsumers(variableId: string): TextNode[] {
  const nodes = figma.currentPage.findAllWithCriteria({ types: ["TEXT"] }) as TextNode[];
  return nodes.filter(
    (candidate) => firstSolidFill(candidate)?.boundVariables?.color?.id === variableId
  );
}
