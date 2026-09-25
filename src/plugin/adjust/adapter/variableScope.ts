import type { AdjustVariableScope } from "../../../shared/adjustMessageTypes";
import { firstSolidFill } from "./bindingLookup";

/**
 * GROUPING_SPEC.md section 9's static facts about a node's bound foreground variable:
 * null when unbound, or bound to a style rather than a variable, since a style is not
 * a valid target for this scope. `remote` distinguishes a library variable, which
 * cannot be edited from a consuming file, from a local one.
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
