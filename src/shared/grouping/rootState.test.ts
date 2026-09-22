import { describe, expect, it } from "vitest";

import { deriveRootState } from "./rootState";

describe("deriveRootState", () => {
  it("shows important when any instance is important, regardless of the rest", () => {
    const { displayState } = deriveRootState(["open", "deferred", "important", "acknowledged"]);
    expect(displayState).toBe("important");
  });

  it("shows open when any instance is open and none is important", () => {
    const { displayState } = deriveRootState(["deferred", "open", "acknowledged"]);
    expect(displayState).toBe("open");
  });

  it("shows deferred when any instance is deferred and none is open or important", () => {
    const { displayState } = deriveRootState(["deferred", "acknowledged", "resolved"]);
    expect(displayState).toBe("deferred");
  });

  it("moves to decided when every instance is acknowledged or resolved", () => {
    const { displayState } = deriveRootState(["acknowledged", "resolved", "acknowledged"]);
    expect(displayState).toBe("decided");
  });

  it("reports a full breakdown of every instance's real state, not just the display state", () => {
    const { breakdown } = deriveRootState(["open", "open", "deferred", "deferred", "deferred"]);
    expect(breakdown).toEqual({ open: 2, deferred: 3 });
  });

  it("a single-state root still gets an accurate breakdown", () => {
    const { displayState, breakdown } = deriveRootState(["open", "open", "open"]);
    expect(displayState).toBe("open");
    expect(breakdown).toEqual({ open: 3 });
  });
});
