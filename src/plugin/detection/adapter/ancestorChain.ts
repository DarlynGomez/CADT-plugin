import type { ChainLayer } from "../colorResolution";
import { extractNodeLayer, extractPageBackgroundLayer } from "./paintExtraction";

/**
 * Walk from a node's parent up to its page, in ancestor order, ending with the page
 * background as the final fallback layer. Assumes the node's page is already loaded,
 * which lifecycle/startup.ts guarantees before any scan runs.
 */
export function buildAncestorChain(node: SceneNode): ChainLayer[] {
  const layers: ChainLayer[] = [];
  let current: BaseNode | null = node.parent;

  while (current && current.type !== "PAGE") {
    layers.push(extractNodeLayer(current));
    current = current.parent;
  }

  if (current) {
    layers.push(extractPageBackgroundLayer(current));
  }

  return layers;
}
