import { reconcileScanResults } from "../accountability/reconcileFindings";
import { runDetection } from "../detection/engine";
import { loadRawIssues, saveIssues } from "../accountability/issueStore";
import { buildIssuesUpdatedMessage } from "./issueDisplay";
import { logFindings } from "./logFindings";
import { resolveTextNodeSnapshot } from "./resolveSnapshot";

/**
 * Detects, reconciles into the record, saves and pushes the list to the UI
 * All detection output reaches the store here
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
