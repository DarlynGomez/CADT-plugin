import type { NodeSnapshot } from "../../shared/issues/issueTypes";
import { snapshotTextNode } from "../detection/adapter/snapshot";

/**
 * Turns a node id into a snapshot for live detection
 * Lives here and not in detection because it touches Figma
 */
export async function resolveTextNodeSnapshot(nodeId: string): Promise<NodeSnapshot | null> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || node.type !== "TEXT") {
    return null;
  }
  return await snapshotTextNode(node);
}
