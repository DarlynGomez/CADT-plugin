import { firstSolidFill } from "../../adjust/adapter/bindingLookup";
import { resolveBoundName } from "../../adjust/adapter/boundName";

/**
 * GROUPING_SPEC.md section 3.1's foreground binding: a variable or style name, or null
 * when unbound. The signature's cheaper need than Adjust's detectFillBinding, which
 * also counts other nodes sharing the binding; a root's signature needs only the name
 */
export async function resolveForegroundBinding(node: TextNode): Promise<string | null> {
  const fill = firstSolidFill(node);
  if (!fill) {
    return null;
  }
  return resolveBoundName(node, fill);
}
