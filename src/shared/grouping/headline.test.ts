import { describe, expect, it } from "vitest";

import type { GroupableFinding, Root, RootDisplayState } from "./groupingTypes";
import { computeHeadline } from "./headline";

let nextNodeId = 0;

function findingIn(
  state: GroupableFinding["state"],
  overrides: Partial<GroupableFinding> = {}
): GroupableFinding {
  nextNodeId += 1;
  return {
    issueId: `contrast:1:${nextNodeId}`,
    nodeId: `1:${nextNodeId}`,
    nodeName: "Text",
    screenId: "screen-1",
    screenName: "Product Detail Screen",
    state,
    severity: "high",
    measuredRatio: 2.17,
    requiredRatio: 4.5,
    foregroundHex: "#9CB5B1",
    backgroundHex: "#FFFFFF",
    foregroundBinding: "sage/muted",
    backgroundBinding: null,
    documentOrder: nextNodeId,
    ...overrides
  };
}

function rootOf(
  instances: readonly GroupableFinding[],
  displayState: RootDisplayState = "open"
): Root {
  const first = instances[0];
  return {
    signature: `${first.foregroundHex}|${first.backgroundHex}|${first.foregroundBinding ?? "unbound"}|${first.requiredRatio}`,
    foregroundHex: first.foregroundHex,
    backgroundHex: first.backgroundHex,
    foregroundBinding: first.foregroundBinding,
    requiredRatio: first.requiredRatio,
    instances,
    representativeIssueId: first.issueId,
    backgroundBindings: [],
    displayState,
    stateBreakdown: {}
  };
}

function openInstances(
  binding: string | null,
  count: number,
  screenId = "screen-1",
  screenName = "Product Detail Screen"
): GroupableFinding[] {
  return Array.from({ length: count }, () =>
    findingIn("open", { foregroundBinding: binding, screenId, screenName })
  );
}

describe("computeHeadline", () => {
  it("names two bindings when together they cover at least 80 percent of open findings", () => {
    const roots = [
      rootOf(openInstances("sage/muted", 90)),
      rootOf(openInstances("indigo/action", 41)),
      rootOf(openInstances("teal/brand", 28))
    ];
    const headline = computeHeadline(roots);
    expect(headline.kind).toBe("concentrated");
    if (headline.kind === "concentrated") {
      expect(headline.bindings.map((b) => b.binding)).toEqual(["sage/muted", "indigo/action"]);
      expect(headline.totalOpenCount).toBe(159);
    }
  });

  it("uses the hex as the binding label when the foreground is unbound", () => {
    const roots = [rootOf(openInstances(null, 10))];
    const headline = computeHeadline(roots);
    expect(headline.kind).toBe("concentrated");
    if (headline.kind === "concentrated") {
      expect(headline.bindings[0].binding).toBe("#9CB5B1");
    }
  });

  it("falls back to a screen count when the top three bindings still fall short of 80 percent", () => {
    const roots = [
      rootOf(openInstances("a/one", 10, "screen-a", "Screen A")),
      rootOf(openInstances("b/two", 10, "screen-b", "Screen B")),
      rootOf(openInstances("c/three", 10, "screen-c", "Screen C")),
      rootOf(openInstances("d/four", 10, "screen-d", "Screen D"))
    ];
    const headline = computeHeadline(roots);
    expect(headline).toEqual({ kind: "unconcentrated", totalOpenCount: 40, screenCount: 4 });
  });

  it("counts two screens that happen to share a name as two, by id", () => {
    const roots = [
      rootOf(openInstances("a/one", 10, "screen-a", "Desktop")),
      rootOf(openInstances("b/two", 10, "screen-b", "Desktop")),
      rootOf(openInstances("c/three", 10, "screen-c", "Desktop")),
      rootOf(openInstances("d/four", 10, "screen-d", "Desktop"))
    ];
    const headline = computeHeadline(roots);
    expect(headline).toEqual({ kind: "unconcentrated", totalOpenCount: 40, screenCount: 4 });
  });

  it("reports nothing open, with the count of roots that moved to the Decisions view", () => {
    const decided = rootOf([findingIn("ignored"), findingIn("resolved")], "decided");
    const alsoDecided = rootOf([findingIn("resolved")], "decided");
    const headline = computeHeadline([decided, alsoDecided]);
    expect(headline).toEqual({ kind: "nothingOpen", decidedRootCount: 2 });
  });
});
