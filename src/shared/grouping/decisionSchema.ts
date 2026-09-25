import type { Severity } from "../issues/issueTypes";
import type { RootDecision } from "./groupingTypes";

const VALID_SEVERITIES: ReadonlySet<string> = new Set(["low", "medium", "high"]);

function isValidSeverity(value: unknown): value is Severity {
  return typeof value === "string" && VALID_SEVERITIES.has(value);
}

/** Exactly the fields spec section 3.4 says to store; signature lives in the map key */
export type PersistedDecisionFields = Omit<RootDecision, "signature">;

/** Structural validation for the on-disk shape */
export function isPersistedDecisionFields(value: unknown): value is PersistedDecisionFields {
  if (!value || typeof value !== "object") {
    return false;
  }
  const decision = value as Record<string, unknown>;
  return (
    typeof decision.reason === "string" &&
    decision.reason.trim().length > 0 &&
    typeof decision.recordedAt === "string" &&
    isValidSeverity(decision.severityAtDecision)
  );
}
