/**
 * Name of the variable or style the paint is bound to, or null
 * A bound variable wins over the style because it is more specific
 */
export async function resolveBoundName(
  node: SceneNode & MinimalFillsMixin,
  fill: SolidPaint
): Promise<string | null> {
  const variableId = fill.boundVariables?.color?.id;
  if (variableId) {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (variable) {
      return variable.name;
    }
  }

  const styleId = node.fillStyleId;
  if (typeof styleId === "string" && styleId) {
    const style = await figma.getStyleByIdAsync(styleId);
    if (style) {
      return style.name;
    }
  }

  return null;
}
