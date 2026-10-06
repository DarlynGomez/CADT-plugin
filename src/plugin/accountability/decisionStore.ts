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

/** The signature lives in the map key so rebuild the decision from both */
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

/** Decisions are keyed by colour combination so nothing goes stale and no pruning is needed */
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

/** Replaces the whole map on every write */
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

/** One reason per signature, ignoring again overwrites it */
export function recordDecision(
  record: DecisionRecordMap,
  decision: RootDecision
): DecisionRecordMap {
  return { ...record, [decision.signature]: decision };
}

/** Drops the decision for a signature after a full reopen, does nothing when there is none */
export function removeDecision(record: DecisionRecordMap, signature: string): DecisionRecordMap {
  if (!(signature in record)) {
    return record;
  }
  const rest: DecisionRecordMap = {};
  for (const [key, value] of Object.entries(record)) {
    if (key !== signature) {
      rest[key] = value;
    }
  }
  return rest;
}
