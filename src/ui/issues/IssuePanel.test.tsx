import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import type { Issue, IssueState } from "../../shared/issues/issueTypes";
import { IssuePanel } from "./IssuePanel";

function issue(id: string, state: IssueState, nodeName: string): Issue & { nodeName: string } {
  return {
    id,
    ruleId: "contrast",
    nodeId: id,
    nodeName,
    state,
    severityAtLastDetection: "medium",
    encounterCount: 0,
    lastDetectedAt: "2026-09-08T00:00:00.000Z"
  };
}

function emit(message: unknown) {
  window.dispatchEvent(new MessageEvent("message", { data: { pluginMessage: message } }));
}

describe("IssuePanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("is a labelled landmark with list semantics", async () => {
    render(<IssuePanel aiAssistanceLevel={1} />);
    await act(async () => {
      emit({ type: "ISSUES_UPDATED", issues: [issue("a", "open", "Body copy")] });
    });

    expect(screen.getByRole("main", { name: "Accessibility issues" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("groups important above open above deferred, regardless of arrival order", async () => {
    render(<IssuePanel aiAssistanceLevel={1} />);
    await act(async () => {
      emit({
        type: "ISSUES_UPDATED",
        issues: [
          issue("d", "deferred", "Deferred one"),
          issue("o", "open", "Open one"),
          issue("i", "important", "Important one")
        ]
      });
    });

    const headings = screen.getAllByRole("heading", { level: 3 }).map((node) => node.textContent);
    expect(headings).toEqual(["Important one", "Open one", "Deferred one"]);
  });

  it("keeps acknowledged and resolved out of the main list but reachable", async () => {
    render(<IssuePanel aiAssistanceLevel={1} />);
    await act(async () => {
      emit({
        type: "ISSUES_UPDATED",
        issues: [
          issue("o", "open", "Open one"),
          issue("a", "acknowledged", "Acknowledged one"),
          issue("r", "resolved", "Resolved one")
        ]
      });
    });

    expect(screen.queryByText("Acknowledged one")).not.toBeInTheDocument();
    expect(screen.queryByText("Resolved one")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /acknowledged and resolved \(2\)/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(screen.getByText("Acknowledged one")).toBeInTheDocument();
    expect(screen.getByText("Resolved one")).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("shows a plain status message when there are no open issues", async () => {
    render(<IssuePanel aiAssistanceLevel={1} />);
    await act(async () => {
      emit({ type: "ISSUES_UPDATED", issues: [] });
    });

    expect(screen.getByText("No open issues. Nice work.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("surfaces an action failure as an alert without losing the current list", async () => {
    render(<IssuePanel aiAssistanceLevel={1} />);
    await act(async () => {
      emit({ type: "ISSUES_UPDATED", issues: [issue("o", "open", "Open one")] });
    });
    await act(async () => {
      emit({ type: "ISSUE_ACTION_FAILED", issueId: "o", message: "Cannot defer an issue in state 'resolved'" });
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Cannot defer an issue in state 'resolved'");
    expect(screen.getByText("Open one")).toBeInTheDocument();
  });
});
