import { describe, expect, it } from "vitest";

import type { Issue, IssueState } from "../../shared/issues/issueTypes";
import {
  acknowledgeIssue,
  createIssue,
  deferIssue,
  flagImportant,
  reconcileDetection,
  recordResurface,
  reopenIssue
} from "./stateMachine";

const NOW = "2026-09-08T00:00:00.000Z";
const LATER = "2026-09-09T00:00:00.000Z";

function issueIn(state: IssueState, overrides: Partial<Issue> = {}): Issue {
  return {
    id: "contrast:1:1",
    ruleId: "contrast",
    nodeId: "1:1",
    state,
    severityAtLastDetection: "medium",
    encounterCount: 0,
    lastDetectedAt: NOW,
    ...overrides
  };
}

describe("createIssue", () => {
  it("always starts open with zero encounters", () => {
    const issue = createIssue("contrast:1:1", "contrast", "1:1", "high", NOW);
    expect(issue).toEqual({
      id: "contrast:1:1",
      ruleId: "contrast",
      nodeId: "1:1",
      state: "open",
      severityAtLastDetection: "high",
      encounterCount: 0,
      lastDetectedAt: NOW
    });
  });
});

describe("deferIssue", () => {
  it.each<IssueState>(["open", "important"])("accepts from %s", (state) => {
    const result = deferIssue(issueIn(state));
    expect(result).toEqual({ ok: true, issue: issueIn(state, { state: "deferred" }) });
  });

  it.each<IssueState>(["deferred", "acknowledged", "resolved"])("rejects from %s", (state) => {
    expect(deferIssue(issueIn(state)).ok).toBe(false);
  });
});

describe("flagImportant", () => {
  it.each<IssueState>(["open", "deferred"])("accepts from %s", (state) => {
    const result = flagImportant(issueIn(state));
    expect(result).toEqual({ ok: true, issue: issueIn(state, { state: "important" }) });
  });

  it.each<IssueState>(["important", "acknowledged", "resolved"])("rejects from %s", (state) => {
    expect(flagImportant(issueIn(state)).ok).toBe(false);
  });
});

describe("acknowledgeIssue", () => {
  it.each<IssueState>(["open", "deferred", "important"])(
    "accepts from %s and stores the reason, timestamp, and severity at acknowledgment",
    (state) => {
      const result = acknowledgeIssue(issueIn(state), "Client insisted on the brand color", LATER);
      expect(result).toEqual({
        ok: true,
        issue: issueIn(state, {
          state: "acknowledged",
          acknowledgedReason: "Client insisted on the brand color",
          acknowledgedAt: LATER,
          severityAtAcknowledgment: "medium",
          changedSinceAcknowledgment: false
        })
      });
    }
  );

  it.each<IssueState>(["acknowledged", "resolved"])("rejects from %s", (state) => {
    expect(acknowledgeIssue(issueIn(state), "reason", LATER).ok).toBe(false);
  });

  it("rejects an empty reason, so the invariant cannot be bypassed by a malformed message", () => {
    const result = acknowledgeIssue(issueIn("open"), "   ", LATER);
    expect(result).toEqual({ ok: false, reason: "Acknowledgment requires a non-empty reason" });
  });
});

describe("reopenIssue", () => {
  it.each<IssueState>(["deferred", "important", "acknowledged"])("accepts from %s", (state) => {
    const result = reopenIssue(issueIn(state));
    expect(result).toEqual({ ok: true, issue: issueIn(state, { state: "open" }) });
  });

  it.each<IssueState>(["open", "resolved"])("rejects from %s", (state) => {
    expect(reopenIssue(issueIn(state)).ok).toBe(false);
  });
});

describe("recordResurface", () => {
  it("increments encounterCount and changes nothing else", () => {
    const issue = issueIn("deferred", { encounterCount: 2 });
    expect(recordResurface(issue)).toEqual({ ...issue, encounterCount: 3 });
  });
});

describe("reconcileDetection", () => {
  it.each<IssueState>(["open", "deferred", "important"])(
    "leaves %s in place, refreshing severity and timestamp",
    (state) => {
      const issue = issueIn(state, { severityAtLastDetection: "low" });
      const result = reconcileDetection(issue, "high", LATER);
      expect(result).toEqual({ ...issue, severityAtLastDetection: "high", lastDetectedAt: LATER });
    }
  );

  it("moves to resolved when the finding stops being produced, never auto-closing to any other state", () => {
    const issue = issueIn("deferred");
    expect(reconcileDetection(issue, null, LATER)).toEqual({ ...issue, state: "resolved" });
  });

  it("is a no-op when an already-resolved issue still produces no finding", () => {
    const issue = issueIn("resolved");
    expect(reconcileDetection(issue, null, LATER)).toEqual(issue);
  });

  it("reopens from resolved when the finding reappears, preserving the record", () => {
    const issue = issueIn("resolved", { encounterCount: 4 });
    const result = reconcileDetection(issue, "medium", LATER);
    expect(result).toEqual({
      ...issue,
      state: "open",
      severityAtLastDetection: "medium",
      lastDetectedAt: LATER
    });
  });

  it("leaves an acknowledged issue standing when the new severity is the same band", () => {
    const issue = issueIn("acknowledged", {
      severityAtAcknowledgment: "medium",
      changedSinceAcknowledgment: false
    });
    const result = reconcileDetection(issue, "medium", LATER);
    expect(result.state).toBe("acknowledged");
    expect(result.changedSinceAcknowledgment).toBe(false);
  });

  it("leaves an acknowledged issue standing when the new severity is better", () => {
    const issue = issueIn("acknowledged", { severityAtAcknowledgment: "high" });
    const result = reconcileDetection(issue, "low", LATER);
    expect(result.state).toBe("acknowledged");
  });

  it("reopens an acknowledged issue once, marked changed, when the new severity is worse", () => {
    const issue = issueIn("acknowledged", { severityAtAcknowledgment: "low" });
    const result = reconcileDetection(issue, "high", LATER);
    expect(result.state).toBe("open");
    expect(result.changedSinceAcknowledgment).toBe(true);
    expect(result.severityAtLastDetection).toBe("high");
  });
});
