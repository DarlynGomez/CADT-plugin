/**
 * The variable or style name a solid paint is bound to on this node, or null when
 * neither binding applies. A paint's own bound variable takes precedence over the
 * node's style, since it is the more specific binding
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
