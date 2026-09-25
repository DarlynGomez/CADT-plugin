import { parseIssueId } from "../../shared/issues/issueId";
import { isPersistedIssueFields, type PersistedIssueFields } from "../../shared/issues/issueSchema";
import type { Issue } from "../../shared/issues/issueTypes";
import { STORAGE_KEY_ISSUES } from "../storage/storageKeys";

export type IssueRecordMap = Record<string, Issue>;
type PersistedMap = Record<string, PersistedIssueFields>;

function parsePersistedMap(raw: string): PersistedMap {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    const validEntries = Object.entries(parsed as Record<string, unknown>).filter(([, value]) =>
      isPersistedIssueFields(value)
    );
    return Object.fromEntries(validEntries) as PersistedMap;
  } catch (error) {
    console.error("loadIssues: stored record was not valid JSON", error);
    return {};
  }
}

/** ruleId and nodeId live only in the map key; reconstruct the full Issue from both */
function toIssue(id: string, fields: PersistedIssueFields): Issue | null {
  const parsed = parseIssueId(id);
  return parsed ? { id, ruleId: parsed.ruleId, nodeId: parsed.nodeId, ...fields } : null;
}

/** The mirror of toIssue: exactly spec section 5.5's fields, nothing derivable from the key */
function toPersistedFields(issue: Issue): PersistedIssueFields {
  return {
    state: issue.state,
    severityAtLastDetection: issue.severityAtLastDetection,
    encounterCount: issue.encounterCount,
    lastDetectedAt: issue.lastDetectedAt,
    ignoredReason: issue.ignoredReason,
    ignoredAt: issue.ignoredAt,
    severityAtIgnore: issue.severityAtIgnore,
    changedSinceIgnore: issue.changedSinceIgnore
  };
}

/**
 * Load the persisted record with no existence check. This is the one path that must
 * never prune: scanAndSync reconciles a DELETE against exactly this, and a node just
 * deleted resolves to null from getNodeByIdAsync immediately, before reconciliation
 * ever runs. Pruning here would drop the record instead of marking it resolved,
 * contradicting spec section 3.1 ("a delete removes the node's issues from the active
 * list but not from the record"). Reconciliation is itself how a genuinely gone node
 * gets accounted for; this function's job is only to not get in its way.
 */
export function loadRawIssues(): IssueRecordMap {
  const persisted = parsePersistedMap(figma.root.getPluginData(STORAGE_KEY_ISSUES));
  const entries = Object.entries(persisted)
    .map(([id, fields]): readonly [string, Issue] | null => {
      const issue = toIssue(id, fields);
      return issue ? [id, issue] : null;
    })
    .filter((entry): entry is readonly [string, Issue] => entry !== null);
  return Object.fromEntries(entries);
}

/**
 * Load the persisted issue record and prune entries whose node no longer exists in
 * this file. For every read that is not itself reconciling a scan, this is the right
 * view: a node that vanished across a session boundary, without CADT ever seeing the
 * delete event live, will never be scanned again to earn a "resolved" verdict, so
 * pruning on load is the only cleanup path that ever reaches it. Figma enforces a size
 * limit on plugin data, so this is not optional. This is the one file in
 * accountability/ that touches the Figma API, the same category as the storage
 * modules: only the snapshot adapter and the storage surfaces read Figma state, and
 * this is a storage surface.
 */
export async function loadIssues(): Promise<IssueRecordMap> {
  const record = loadRawIssues();

  const survivors = await Promise.all(
    Object.entries(record).map(async ([id, issue]): Promise<readonly [string, Issue] | null> => {
      const node = await figma.getNodeByIdAsync(issue.nodeId);
      return node ? [id, issue] : null;
    })
  );

  return Object.fromEntries(
    survivors.filter((entry): entry is readonly [string, Issue] => entry !== null)
  );
}

export interface IssueSaveResult {
  saved: boolean;
  error?: string;
}

/** Persist the full record. Every write replaces the whole map; there is no partial update. */
export function saveIssues(record: IssueRecordMap): IssueSaveResult {
  const persisted: PersistedMap = {};
  for (const [id, issue] of Object.entries(record)) {
    persisted[id] = toPersistedFields(issue);
  }

  try {
    figma.root.setPluginData(STORAGE_KEY_ISSUES, JSON.stringify(persisted));
    return { saved: true };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : String(error);
    console.error("saveIssues: figma.root.setPluginData failed", error);
    return { saved: false, error: message };
  }
}
