import { firstSolidFill } from "../../adjust/adapter/bindingLookup";
import { resolveBoundName } from "../../adjust/adapter/boundName";

/** Foreground binding name, null when unbound, cheaper than counting other nodes that share it */
export async function resolveForegroundBinding(node: TextNode): Promise<string | null> {
  const fill = firstSolidFill(node);
  if (!fill) {
    return null;
  }
  return resolveBoundName(node, fill);
}
