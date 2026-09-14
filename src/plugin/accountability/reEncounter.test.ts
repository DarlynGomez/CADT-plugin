import { describe, expect, it } from "vitest";

import {
  applySelectionChange,
  forgetIssue,
  initializeReEncounterState,
  markDeferred,
  type DeferredIssueRef
} from "./reEncounter";

const ISSUE_A: DeferredIssueRef = { id: "contrast:1:1", nodeId: "1:1" };
const ISSUE_B: DeferredIssueRef = { id: "contrast:1:2", nodeId: "1:2" };

describe("initializeReEncounterState", () => {
  it("arms the guard for a deferred issue already selected at startup", () => {
    const state = initializeReEncounterState(new Set(["1:1"]), [ISSUE_A, ISSUE_B]);
    expect(state.waitingForSelectionToLeave).toEqual(new Set(["contrast:1:1"]));
  });

  it("arms nothing when the selection is empty", () => {
    const state = initializeReEncounterState(new Set(), [ISSUE_A]);
    expect(state.waitingForSelectionToLeave.size).toBe(0);
  });
});

describe("markDeferred", () => {
  it("arms the guard for the given issue without disturbing others", () => {
    const initial = initializeReEncounterState(new Set(), []);
    const state = markDeferred(initial, ISSUE_A.id);
    expect(state.waitingForSelectionToLeave).toEqual(new Set([ISSUE_A.id]));
  });
});

describe("forgetIssue", () => {
  it("removes an issue's guard", () => {
    const armed = markDeferred(initializeReEncounterState(new Set(), []), ISSUE_A.id);
    const state = forgetIssue(armed, ISSUE_A.id);
    expect(state.waitingForSelectionToLeave.size).toBe(0);
  });

  it("is a no-op when the issue has no guard set", () => {
    const initial = initializeReEncounterState(new Set(), []);
    expect(forgetIssue(initial, ISSUE_A.id)).toBe(initial);
  });
});

describe("applySelectionChange", () => {
  it("does not resurface an issue deferred while its node is still selected", () => {
    let state = initializeReEncounterState(new Set(), []);
    state = markDeferred(state, ISSUE_A.id);

    const outcome = applySelectionChange(state, new Set(["1:1"]), [ISSUE_A]);
    expect(outcome.resurfacedIssueIds).toEqual([]);
  });

  it("clears the guard once selection leaves the node", () => {
    let state = initializeReEncounterState(new Set(), []);
    state = markDeferred(state, ISSUE_A.id);

    const outcome = applySelectionChange(state, new Set(), [ISSUE_A]);
    expect(outcome.state.waitingForSelectionToLeave.size).toBe(0);
    expect(outcome.resurfacedIssueIds).toEqual([]);
  });

  it("resurfaces once selection returns to the node after leaving", () => {
    let state = initializeReEncounterState(new Set(), []);
    state = markDeferred(state, ISSUE_A.id);
    state = applySelectionChange(state, new Set(), [ISSUE_A]).state;

    const outcome = applySelectionChange(state, new Set(["1:1"]), [ISSUE_A]);
    expect(outcome.resurfacedIssueIds).toEqual([ISSUE_A.id]);
  });

  it("does not resurface again while selection remains on the node across further events", () => {
    let state = initializeReEncounterState(new Set(), []);
    state = markDeferred(state, ISSUE_A.id);
    state = applySelectionChange(state, new Set(), [ISSUE_A]).state;

    const first = applySelectionChange(state, new Set(["1:1"]), [ISSUE_A]);
    const second = applySelectionChange(first.state, new Set(["1:1"]), [ISSUE_A]);
    expect(second.resurfacedIssueIds).toEqual([]);
  });

  it("resurfaces via an ancestor already present in the expanded selection set", () => {
    let state = initializeReEncounterState(new Set(), []);
    state = markDeferred(state, ISSUE_A.id);
    state = applySelectionChange(state, new Set(), [ISSUE_A]).state;

    // The caller expands the raw Figma selection to include ancestors before calling
    // in, so selecting a frame that contains the node reads the same as selecting it.
    const outcome = applySelectionChange(state, new Set(["frame:1", "1:1"]), [ISSUE_A]);
    expect(outcome.resurfacedIssueIds).toEqual([ISSUE_A.id]);
  });

  it("tracks multiple deferred issues independently", () => {
    let state = initializeReEncounterState(new Set(), []);
    state = markDeferred(state, ISSUE_A.id);
    state = markDeferred(state, ISSUE_B.id);
    state = applySelectionChange(state, new Set(), [ISSUE_A, ISSUE_B]).state;

    const outcome = applySelectionChange(state, new Set(["1:1"]), [ISSUE_A, ISSUE_B]);
    expect(outcome.resurfacedIssueIds).toEqual([ISSUE_A.id]);
  });
});
