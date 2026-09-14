import { describe, expect, it } from "vitest";

import { buildIssueId, parseIssueId } from "./issueId";

describe("buildIssueId", () => {
  it("joins ruleId and nodeId with a colon", () => {
    expect(buildIssueId("contrast", "1:23")).toBe("contrast:1:23");
  });
});

describe("parseIssueId", () => {
  it("round-trips a node id that itself contains a colon", () => {
    const id = buildIssueId("contrast", "1:23");
    expect(parseIssueId(id)).toEqual({ ruleId: "contrast", nodeId: "1:23" });
  });

  it("splits on only the first colon", () => {
    expect(parseIssueId("contrast:1:23:45")).toEqual({ ruleId: "contrast", nodeId: "1:23:45" });
  });

  it("returns null when there is no separator", () => {
    expect(parseIssueId("contrast")).toBeNull();
  });

  it("returns null when the rule id is empty", () => {
    expect(parseIssueId(":1:23")).toBeNull();
  });

  it("returns null when the node id is empty", () => {
    expect(parseIssueId("contrast:")).toBeNull();
  });
});
