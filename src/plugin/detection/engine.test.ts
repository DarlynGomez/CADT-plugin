import { describe, expect, it } from "vitest";

import type { NodeSnapshot } from "../../shared/issues/issueTypes";
import { runDetection } from "./engine";

const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 1, g: 1, b: 1 };
const LOW_CONTRAST_GRAY = { r: 0.85, g: 0.85, b: 0.85 };

function textSnapshot(nodeId: string, overrides: Partial<NodeSnapshot> = {}): NodeSnapshot {
  return {
    nodeId,
    nodeName: "Body copy",
    nodeType: "TEXT",
    foreground: BLACK,
    background: WHITE,
    fontSizePx: 16,
    isBold: false,
    indeterminateReasons: [],
    ...overrides
  };
}

describe("runDetection", () => {
  it("produces a finding for a node that fails the registered rule", async () => {
    const snapshots = new Map([["1:1", textSnapshot("1:1", { foreground: LOW_CONTRAST_GRAY })]]);
    const findings = await runDetection(new Set(["1:1"]), async (id) => snapshots.get(id) ?? null);

    expect(findings).toHaveLength(1);
    expect(findings[0].nodeId).toBe("1:1");
    expect(findings[0].ruleId).toBe("contrast");
  });

  it("produces no findings for a node that passes every registered rule", async () => {
    const snapshots = new Map([["1:1", textSnapshot("1:1")]]);
    const findings = await runDetection(new Set(["1:1"]), async (id) => snapshots.get(id) ?? null);

    expect(findings).toEqual([]);
  });

  it("skips a node id that no longer resolves rather than throwing", async () => {
    const findings = await runDetection(new Set(["gone"]), async () => null);
    expect(findings).toEqual([]);
  });

  it("evaluates every id in the set independently", async () => {
    const snapshots = new Map([
      ["1:1", textSnapshot("1:1", { foreground: LOW_CONTRAST_GRAY })],
      ["1:2", textSnapshot("1:2")],
      ["1:3", textSnapshot("1:3", { foreground: LOW_CONTRAST_GRAY })]
    ]);
    const findings = await runDetection(
      new Set(["1:1", "1:2", "1:3"]),
      async (id) => snapshots.get(id) ?? null
    );

    expect(findings.map((finding) => finding.nodeId).sort()).toEqual(["1:1", "1:3"]);
  });
});
