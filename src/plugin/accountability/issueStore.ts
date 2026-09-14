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
    acknowledgedReason: issue.acknowledgedReason,
    acknowledgedAt: issue.acknowledgedAt,
    severityAtAcknowledgment: issue.severityAtAcknowledgment,
    changedSinceAcknowledgment: issue.changedSinceAcknowledgment
  };
}

/**
 * Load the persisted issue record and prune entries whose node no longer exists in
 * this file. Figma enforces a size limit on plugin data, so pruning on every load is
 * not optional, not an optimization. This is the one file in accountability/ that
 * touches the Figma API, the same category as the storage modules: only the snapshot
 * adapter and the storage surfaces read Figma state, and this is a storage surface.
 */
export async function loadIssues(): Promise<IssueRecordMap> {
  const persisted = parsePersistedMap(figma.root.getPluginData(STORAGE_KEY_ISSUES));

  const survivors = await Promise.all(
    Object.entries(persisted).map(async ([id, fields]): Promise<readonly [string, Issue] | null> => {
      const issue = toIssue(id, fields);
      if (!issue) {
        return null;
      }
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
