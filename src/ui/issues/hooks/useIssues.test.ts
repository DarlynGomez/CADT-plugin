import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { IssueSummary } from "../../../shared/issues/issueTypes";
import { useIssues } from "./useIssues";

const ISSUE: IssueSummary = {
  id: "contrast:1:1",
  ruleId: "contrast",
  nodeId: "1:1",
  nodeName: "Body copy",
  state: "open",
  severityAtLastDetection: "high",
  encounterCount: 0,
  lastDetectedAt: "2026-09-08T00:00:00.000Z"
};

function emit(message: unknown) {
  window.dispatchEvent(new MessageEvent("message", { data: { pluginMessage: message } }));
}

describe("useIssues", () => {
  it("subscribes on mount and stores the full list it receives", async () => {
    const postMessage = vi.spyOn(window.parent, "postMessage");
    const { result } = renderHook(() => useIssues());

    expect(postMessage).toHaveBeenCalledWith({ pluginMessage: { type: "ISSUES_SUBSCRIBE" } }, "*");
    expect(result.current.loading).toBe(true);

    await act(async () => {
      emit({ type: "ISSUES_UPDATED", issues: [ISSUE] });
    });

    expect(result.current.issues).toEqual([ISSUE]);
    expect(result.current.loading).toBe(false);
    postMessage.mockRestore();
  });

  it("ignores a message with an invalid issue in the list", async () => {
    const { result } = renderHook(() => useIssues());

    await act(async () => {
      emit({ type: "ISSUES_UPDATED", issues: [{ nodeId: "1:1" }] });
    });

    expect(result.current.issues).toEqual([]);
  });

  it.each([
    ["deferIssue", "ISSUE_DEFER"],
    ["flagImportant", "ISSUE_FLAG_IMPORTANT"],
    ["reopenIssue", "ISSUE_REOPEN"],
    ["focusIssue", "ISSUE_FOCUS"]
  ] as const)("%s sends a bare %s message with the issue id", async (action, type) => {
    const postMessage = vi.spyOn(window.parent, "postMessage");
    const { result } = renderHook(() => useIssues());

    act(() => {
      result.current[action](ISSUE.id);
    });

    expect(postMessage).toHaveBeenCalledWith({ pluginMessage: { type, issueId: ISSUE.id } }, "*");
    postMessage.mockRestore();
  });

  it("sends the reason along with an acknowledgment", async () => {
    const postMessage = vi.spyOn(window.parent, "postMessage");
    const { result } = renderHook(() => useIssues());

    act(() => {
      result.current.acknowledgeIssue(ISSUE.id, "Client insisted on the brand color");
    });

    expect(postMessage).toHaveBeenCalledWith(
      {
        pluginMessage: {
          type: "ISSUE_ACKNOWLEDGE",
          issueId: ISSUE.id,
          reason: "Client insisted on the brand color"
        }
      },
      "*"
    );
    postMessage.mockRestore();
  });

  it("surfaces a rejected action without discarding the current list", async () => {
    const { result } = renderHook(() => useIssues());

    await act(async () => {
      emit({ type: "ISSUES_UPDATED", issues: [ISSUE] });
    });
    await act(async () => {
      emit({ type: "ISSUE_ACTION_FAILED", issueId: ISSUE.id, message: "Cannot defer an issue in state 'resolved'" });
    });

    expect(result.current.actionError).toEqual({
      issueId: ISSUE.id,
      message: "Cannot defer an issue in state 'resolved'"
    });
    expect(result.current.issues).toEqual([ISSUE]);
  });

  it("clears a prior action error once a fresh list arrives", async () => {
    const { result } = renderHook(() => useIssues());

    await act(async () => {
      emit({ type: "ISSUE_ACTION_FAILED", issueId: ISSUE.id, message: "failed" });
    });
    expect(result.current.actionError).not.toBeNull();

    await act(async () => {
      emit({ type: "ISSUES_UPDATED", issues: [] });
    });
    expect(result.current.actionError).toBeNull();
  });
});
