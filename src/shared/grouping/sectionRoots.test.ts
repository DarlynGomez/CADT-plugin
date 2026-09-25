import { describe, expect, it } from "vitest";

import type { GroupableFinding } from "./groupingTypes";
import { sectionRoots } from "./sectionRoots";

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

describe("sectionRoots", () => {
  it("returns one unsectioned section for root cause grouping", () => {
    const sections = sectionRoots(
      [
        finding({ issueId: "a" }),
        finding({ issueId: "b", foregroundHex: "#000000", foregroundBinding: "ink" })
      ],
      "root-cause"
    );
    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBe("");
    expect(sections[0].roots).toHaveLength(2);
  });

  it("sections by screen, deriving roots separately within each screen", () => {
    const sections = sectionRoots(
      [
        finding({ issueId: "a", screenId: "screen-checkout", screenName: "Checkout" }),
        finding({ issueId: "b", screenId: "screen-checkout", screenName: "Checkout" }),
        finding({ issueId: "c", screenId: "screen-1", screenName: "Product Detail Screen" })
      ],
      "screen"
    );
    expect(sections).toHaveLength(2);
    const checkout = sections.find((s) => s.key === "screen-checkout");
    expect(checkout?.label).toBe("Checkout");
    expect(checkout?.roots).toHaveLength(1);
    expect(checkout?.roots[0]?.instances).toHaveLength(2);
  });

  it("sections by severity with a display label", () => {
    const sections = sectionRoots(
      [finding({ issueId: "a", severity: "high" }), finding({ issueId: "b", severity: "low" })],
      "severity"
    );
    expect(sections.find((s) => s.key === "high")?.label).toBe("High");
    expect(sections.find((s) => s.key === "low")?.label).toBe("Low");
  });
});
