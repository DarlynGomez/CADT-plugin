import type { Finding, NodeSnapshot } from "../../shared/issues/issueTypes";
import { RULES } from "./rules/registry";

/**
 * Turns a node id into a snapshot, or null when gone
 * Injected so this file never calls the Figma API itself
 */
export type SnapshotResolver = (nodeId: string) => Promise<NodeSnapshot | null>;

/**
 * Turns changed node ids into findings by running every rule on each snapshot
 * A node deleted since it was queued gives no findings instead of throwing
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
