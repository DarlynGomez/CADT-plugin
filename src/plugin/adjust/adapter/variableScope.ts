import type { AdjustVariableScope } from "../../../shared/adjustMessageTypes";
import { firstSolidFill } from "./bindingLookup";

/**
 * Facts about the bound foreground variable, null when unbound or bound to a style
 * remote means a library variable that cannot be edited from this file
 */
export async function resolveVariableScope(node: TextNode): Promise<AdjustVariableScope | null> {
  const variableId = firstSolidFill(node)?.boundVariables?.color?.id;
  if (!variableId) {
    return null;
  }

  const variable = await figma.variables.getVariableByIdAsync(variableId);
  if (!variable) {
    return null;
  }

  const collection = await figma.variables.getVariableCollectionByIdAsync(
    variable.variableCollectionId
  );
  if (!collection) {
    return null;
  }

  const modeId = node.resolvedVariableModes[collection.id] ?? collection.defaultModeId;
  const mode = collection.modes.find((candidate) => candidate.modeId === modeId);

  return {
    variableId: variable.id,
    name: variable.name,
    collectionName: collection.name,
    modeName: mode?.name ?? collection.modes[0]?.name ?? "Default",
    remote: variable.remote
  };
}
