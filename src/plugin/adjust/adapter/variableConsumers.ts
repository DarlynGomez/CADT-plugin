import { firstSolidFill } from "./bindingLookup";

/** Text nodes on the current page bound to this variable, page scoped to keep scans cheap */
export function findVariableConsumers(variableId: string): TextNode[] {
  const nodes = figma.currentPage.findAllWithCriteria({ types: ["TEXT"] }) as TextNode[];
  return nodes.filter(
    (candidate) => firstSolidFill(candidate)?.boundVariables?.color?.id === variableId
  );
}
