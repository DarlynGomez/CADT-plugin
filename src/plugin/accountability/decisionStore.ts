import {
  isPersistedDecisionFields,
  type PersistedDecisionFields
} from "../../shared/grouping/decisionSchema";
import type { RootDecision } from "../../shared/grouping/groupingTypes";
import { STORAGE_KEY_DECISIONS } from "../storage/storageKeys";

export type DecisionRecordMap = Record<string, RootDecision>;
type PersistedMap = Record<string, PersistedDecisionFields>;

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
      isPersistedDecisionFields(value)
    );
    return Object.fromEntries(validEntries) as PersistedMap;
  } catch (error) {
    console.error("loadDecisions: stored record was not valid JSON", error);
    return {};
  }
}

/** signature lives only in the map key; reconstruct the full RootDecision from both */
function toDecision(signature: string, fields: PersistedDecisionFields): RootDecision {
  return { signature, ...fields };
}

function toPersistedFields(decision: RootDecision): PersistedDecisionFields {
  return {
    reason: decision.reason,
    recordedAt: decision.recordedAt,
    severityAtDecision: decision.severityAtDecision
  };
}

/**
 * Load the persisted decision record. Unlike issueStore.ts's loadIssues, there is no
 * pruning pass: a decision is keyed by signature, a colour combination, not by a node
 * id that could stop existing, so nothing here ever goes stale the way an issue record
 * does. Synchronous for the same reason, no node lookup is needed to decide what survives
 */
export function loadDecisions(): DecisionRecordMap {
  const persisted = parsePersistedMap(figma.root.getPluginData(STORAGE_KEY_DECISIONS));
  const entries = Object.entries(persisted).map(
    ([signature, fields]): readonly [string, RootDecision] => [
      signature,
      toDecision(signature, fields)
    ]
  );
  return Object.fromEntries(entries);
}

export interface DecisionSaveResult {
  saved: boolean;
  error?: string;
}

/** Persist the full record. Every write replaces the whole map; there is no partial update */
export function saveDecisions(record: DecisionRecordMap): DecisionSaveResult {
  const persisted: PersistedMap = {};
  for (const [signature, decision] of Object.entries(record)) {
    persisted[signature] = toPersistedFields(decision);
  }

  try {
    figma.root.setPluginData(STORAGE_KEY_DECISIONS, JSON.stringify(persisted));
    return { saved: true };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : String(error);
    console.error("saveDecisions: figma.root.setPluginData failed", error);
    return { saved: false, error: message };
  }
}

/** GROUPING_SPEC.md 3.4: one reason per signature; ignoring the same root again overwrites it */
export function recordDecision(
  record: DecisionRecordMap,
  decision: RootDecision
): DecisionRecordMap {
  return { ...record, [decision.signature]: decision };
}
