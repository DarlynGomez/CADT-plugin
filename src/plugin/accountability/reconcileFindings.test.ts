import { describe, expect, it } from "vitest";

import type { Finding, Issue } from "../../shared/issues/issueTypes";
import { reconcileScanResults } from "./reconcileFindings";

const NOW = "2026-09-08T00:00:00.000Z";
const LATER = "2026-09-09T00:00:00.000Z";

function finding(nodeId: string, severity: Finding["severity"]): Finding {
  return { ruleId: "contrast", nodeId, severity, evidence: {} };
}

function issue(nodeId: string, overrides: Partial<Issue> = {}): Issue {
  return {
    id: `contrast:${nodeId}`,
    ruleId: "contrast",
    nodeId,
    state: "open",
    severityAtLastDetection: "medium",
    encounterCount: 0,
    lastDetectedAt: NOW,
    ...overrides
  };
}

describe("reconcileScanResults", () => {
  it("creates a new open issue for a finding with no existing record", () => {
    const result = reconcileScanResults({}, new Set(["1:1"]), [finding("1:1", "high")], LATER);

    expect(result["contrast:1:1"]).toMatchObject({
      id: "contrast:1:1",
      ruleId: "contrast",
      nodeId: "1:1",
      state: "open",
      severityAtLastDetection: "high",
      encounterCount: 0
    });
  });

  it("refreshes severity and timestamp for an existing open issue that still fails", () => {
    const existing = issue("1:1", { severityAtLastDetection: "low" });
    const result = reconcileScanResults(
      { "contrast:1:1": existing },
      new Set(["1:1"]),
      [finding("1:1", "high")],
      LATER
    );

    expect(result["contrast:1:1"]).toEqual({
      ...existing,
      severityAtLastDetection: "high",
      lastDetectedAt: LATER
    });
  });

  it("resolves an issue whose finding stopped being produced, keeping the record", () => {
    const existing = issue("1:1", { state: "deferred" });
    const result = reconcileScanResults({ "contrast:1:1": existing }, new Set(["1:1"]), [], LATER);

    expect(result["contrast:1:1"]).toMatchObject({ id: "contrast:1:1", state: "resolved" });
  });

  it("reopens a resolved issue when its finding reappears, preserving the record", () => {
    const existing = issue("1:1", { state: "resolved", encounterCount: 3 });
    const result = reconcileScanResults(
      { "contrast:1:1": existing },
      new Set(["1:1"]),
      [finding("1:1", "medium")],
      LATER
    );

    expect(result["contrast:1:1"]).toEqual({
      ...existing,
      state: "open",
      severityAtLastDetection: "medium",
      lastDetectedAt: LATER
    });
  });

  it("does not let an ignored issue reappear when the recurring finding is no worse", () => {
    const existing = issue("1:1", {
      state: "ignored",
      severityAtIgnore: "high",
      ignoredReason: "Client insisted",
      ignoredAt: NOW
    });
    const result = reconcileScanResults(
      { "contrast:1:1": existing },
      new Set(["1:1"]),
      [finding("1:1", "high")],
      LATER
    );

    expect(result["contrast:1:1"].state).toBe("ignored");
  });

  it("reopens an ignored issue once when the recurring finding is worse", () => {
    const existing = issue("1:1", { state: "ignored", severityAtIgnore: "low" });
    const result = reconcileScanResults(
      { "contrast:1:1": existing },
      new Set(["1:1"]),
      [finding("1:1", "high")],
      LATER
    );

    expect(result["contrast:1:1"]).toMatchObject({ state: "open", changedSinceIgnore: true });
  });

  it("leaves a node outside the scanned set completely untouched", () => {
    const existing = issue("9:9", { state: "deferred" });
    const result = reconcileScanResults(
      { "contrast:9:9": existing },
      new Set(["1:1"]),
      [finding("1:1", "high")],
      LATER
    );

    expect(result["contrast:9:9"]).toEqual(existing);
  });

  it("does nothing for a node that was scanned and never had or gets a finding", () => {
    const result = reconcileScanResults({}, new Set(["1:1"]), [], LATER);
    expect(result).toEqual({});
  });
});
