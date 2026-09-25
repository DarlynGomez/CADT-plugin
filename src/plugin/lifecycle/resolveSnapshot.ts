import type { NodeSnapshot } from "../../shared/issues/issueTypes";
import { snapshotTextNode } from "../detection/adapter/snapshot";

/**
 * The one place that turns a node id into a snapshot for the live detection loop.
 * Figma-touching, so it lives in lifecycle rather than detection: only the snapshot
 * adapter, the storage modules, and the plugin lifecycle read a Figma node at all.
 */
export async function resolveTextNodeSnapshot(nodeId: string): Promise<NodeSnapshot | null> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || node.type !== "TEXT") {
    return null;
  }
  return await snapshotTextNode(node);
}
