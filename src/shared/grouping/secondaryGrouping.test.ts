import { describe, expect, it } from "vitest";

import type { GroupableFinding } from "./groupingTypes";
import { groupByScreen, groupBySeverity } from "./secondaryGrouping";

function finding(overrides: Partial<GroupableFinding> = {}): GroupableFinding {
  return {
    issueId: "contrast:1:1",
    nodeId: "1:1",
    nodeName: "Text",
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

describe("groupByScreen", () => {
  it("buckets findings by screen name", () => {
    const groups = groupByScreen([
      finding({ issueId: "a", screenName: "Checkout" }),
      finding({ issueId: "b", screenName: "Checkout" }),
      finding({ issueId: "c", screenName: "Product Detail Screen" })
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.key === "Checkout")?.instances).toHaveLength(2);
    expect(groups.find((g) => g.key === "Product Detail Screen")?.instances).toHaveLength(1);
  });
});

describe("groupBySeverity", () => {
  it("buckets findings by severity band", () => {
    const groups = groupBySeverity([
      finding({ issueId: "a", severity: "high" }),
      finding({ issueId: "b", severity: "low" }),
      finding({ issueId: "c", severity: "high" })
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.key === "high")?.instances).toHaveLength(2);
    expect(groups.find((g) => g.key === "low")?.instances).toHaveLength(1);
  });
});
