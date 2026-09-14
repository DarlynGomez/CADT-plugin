import type { Finding, NodeSnapshot } from "../../shared/issues/issueTypes";
import { RULES } from "./rules/registry";

/**
 * Resolves one node id to a snapshot, or null if it is gone or not a resolvable node.
 * Injected so this file never touches figma.getNodeByIdAsync itself: the real resolver
 * lives in lifecycle/resolveSnapshot.ts, which is Figma-touching and allowed to be.
 */
export type SnapshotResolver = (nodeId: string) => Promise<NodeSnapshot | null>;

/**
 * Turn a flushed set of node ids into findings: resolve each id to a snapshot, then run
 * every registered rule against it. A node that no longer resolves, deleted since the
 * change was queued, contributes no findings rather than throwing.
 */
export async function runDetection(
  nodeIds: ReadonlySet<string>,
  resolveSnapshot: SnapshotResolver
): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const nodeId of nodeIds) {
    const snapshot = await resolveSnapshot(nodeId);
    if (!snapshot) {
      continue;
    }
    for (const rule of RULES) {
      const finding = rule.evaluate(snapshot);
      if (finding) {
        findings.push(finding);
      }
    }
  }

  return findings;
}
