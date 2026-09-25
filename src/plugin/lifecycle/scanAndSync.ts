import { reconcileScanResults } from "../accountability/reconcileFindings";
import { runDetection } from "../detection/engine";
import { loadRawIssues, saveIssues } from "../accountability/issueStore";
import { buildIssuesUpdatedMessage } from "./issueDisplay";
import { logFindings } from "./logFindings";
import { resolveTextNodeSnapshot } from "./resolveSnapshot";

/**
 * Run detection over a set of node ids, reconcile the results into the persisted
 * issue record, save, and push the updated list to any open UI. The one place
 * detection output reaches the store, so this is the only file that needs to change
 * if a second rule, or a second trigger for a scan, is added later.
 */
export async function scanAndSync(nodeIds: ReadonlySet<string>, label: string): Promise<void> {
  const findings = await runDetection(nodeIds, resolveTextNodeSnapshot);
  logFindings(label, nodeIds, findings);

  if (nodeIds.size === 0) {
    return;
  }

  const record = loadRawIssues();
  const updated = reconcileScanResults(record, nodeIds, findings, new Date().toISOString());

  const saveResult = saveIssues(updated);
  if (!saveResult.saved) {
    console.error(`${label}: failed to persist the issue record`, saveResult.error);
    return;
  }

  figma.ui.postMessage(await buildIssuesUpdatedMessage(updated));
}
