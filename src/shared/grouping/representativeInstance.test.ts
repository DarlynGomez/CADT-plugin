import { describe, expect, it } from "vitest";

import type { GroupableFinding } from "./groupingTypes";
import {
  DECISIONS_ELIGIBLE_STATES,
  pickRepresentativeInstance,
  TO_REVIEW_ELIGIBLE_STATES
} from "./representativeInstance";

function finding(overrides: Partial<GroupableFinding> = {}): GroupableFinding {
  return {
    issueId: "contrast:1:1",
    nodeId: "1:1",
    nodeName: "Text",
    screenId: "screen-1",
    screenName: "Product Detail Screen",
    state: "open",
    severity: "high",
    measuredRatio: 2.17,
    requiredRatio: 4.5,
    foregroundHex: "#9CB5B1",
    backgroundHex: "#FFFFFF",
    foregroundBinding: "sage/muted",
    backgroundBinding: null,
    documentOrder: 0,
    ...overrides
  };
}

describe("pickRepresentativeInstance", () => {
  it("picks the first eligible instance in document order when the designer selected none", () => {
    const pool = [
      finding({ issueId: "a", nodeId: "1:2", documentOrder: 5 }),
      finding({ issueId: "b", nodeId: "1:1", documentOrder: 2 })
    ];
    expect(pickRepresentativeInstance(pool, TO_REVIEW_ELIGIBLE_STATES, []).issueId).toBe("b");
  });

  it("picks the instance the designer most recently selected over document order", () => {
    const pool = [
      finding({ issueId: "a", nodeId: "1:1", documentOrder: 0 }),
      finding({ issueId: "b", nodeId: "1:2", documentOrder: 1 })
    ];
    expect(pickRepresentativeInstance(pool, TO_REVIEW_ELIGIBLE_STATES, ["1:2"]).issueId).toBe("b");
  });

  it("excludes ineligible instances from both the selection check and the document-order fallback", () => {
    const pool = [
      finding({ issueId: "acked", nodeId: "1:1", state: "ignored", documentOrder: 0 }),
      finding({ issueId: "open", nodeId: "1:2", state: "open", documentOrder: 1 })
    ];
    // The designer's most recent selection was the ignored one, but it is not
    // eligible for To review, so the eligible instance wins regardless of selection
    const result = pickRepresentativeInstance(pool, TO_REVIEW_ELIGIBLE_STATES, ["1:1"]);
    expect(result.issueId).toBe("open");
  });

  it("narrows to ignored and resolved for the Decisions eligible set", () => {
    const pool = [
      finding({ issueId: "open", nodeId: "1:1", state: "open", documentOrder: 0 }),
      finding({ issueId: "resolved", nodeId: "1:2", state: "resolved", documentOrder: 1 })
    ];
    expect(pickRepresentativeInstance(pool, DECISIONS_ELIGIBLE_STATES, []).issueId).toBe(
      "resolved"
    );
  });

  it("throws when nothing in the pool is in an eligible state", () => {
    const pool = [finding({ state: "deferred" })];
    expect(() => pickRepresentativeInstance(pool, DECISIONS_ELIGIBLE_STATES, [])).toThrow();
  });
});
