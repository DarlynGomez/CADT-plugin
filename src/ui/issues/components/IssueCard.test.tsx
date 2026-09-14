import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { IssueSummary } from "../../../shared/issues/issueTypes";
import { IssueCard } from "./IssueCard";

const BASE_ISSUE: IssueSummary = {
  id: "contrast:1:1",
  ruleId: "contrast",
  nodeId: "1:1",
  nodeName: "Body copy",
  state: "open",
  severityAtLastDetection: "high",
  encounterCount: 0,
  lastDetectedAt: "2026-09-08T00:00:00.000Z",
  evidence: { measuredRatio: 1.5, requiredRatio: 4.5 }
};

function renderCard(issue: IssueSummary, handlers: Partial<Parameters<typeof IssueCard>[0]> = {}) {
  const onDefer = vi.fn();
  const onFlagImportant = vi.fn();
  const onReopen = vi.fn();
  const onAcknowledge = vi.fn();
  const onFocus = vi.fn();
  render(
    <ul>
      <IssueCard
        issue={issue}
        onDefer={onDefer}
        onFlagImportant={onFlagImportant}
        onReopen={onReopen}
        onAcknowledge={onAcknowledge}
        onFocus={onFocus}
        {...handlers}
      />
    </ul>
  );
  return { onDefer, onFlagImportant, onReopen, onAcknowledge, onFocus };
}

describe("IssueCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the node name, rule, evidence, and severity as text", () => {
    renderCard(BASE_ISSUE);

    expect(screen.getByRole("heading", { name: "Body copy", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Contrast")).toBeInTheDocument();
    expect(screen.getByText("1.50:1 measured, 4.5:1 required")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("shows every action valid from open, and calls onFocus with the issue id", () => {
    const { onFocus } = renderCard(BASE_ISSUE);

    expect(screen.getByRole("button", { name: "Defer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Flag as important" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Acknowledge" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reopen" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show me" }));
    expect(onFocus).toHaveBeenCalledWith(BASE_ISSUE.id);
  });

  it("only offers Reopen and Show me for an acknowledged issue", () => {
    renderCard({ ...BASE_ISSUE, state: "acknowledged" });

    expect(screen.getByRole("button", { name: "Reopen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Defer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Flag as important" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Acknowledge" })).not.toBeInTheDocument();
  });

  it("defers and flags important with the issue id", () => {
    const { onDefer, onFlagImportant } = renderCard(BASE_ISSUE);

    fireEvent.click(screen.getByRole("button", { name: "Defer" }));
    expect(onDefer).toHaveBeenCalledWith(BASE_ISSUE.id);

    fireEvent.click(screen.getByRole("button", { name: "Flag as important" }));
    expect(onFlagImportant).toHaveBeenCalledWith(BASE_ISSUE.id);
  });

  it("opens an acknowledge form with the submit disabled until a reason is entered", () => {
    const { onAcknowledge } = renderCard(BASE_ISSUE);

    fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));
    const submit = screen.getByRole("button", { name: "Acknowledge" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox", { name: "Reason for this decision" }), {
      target: { value: "Client insisted on the brand color" }
    });
    expect(submit).toBeEnabled();

    fireEvent.click(submit);
    expect(onAcknowledge).toHaveBeenCalledWith(BASE_ISSUE.id, "Client insisted on the brand color");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("cancels the acknowledge form without calling onAcknowledge", () => {
    const { onAcknowledge } = renderCard(BASE_ISSUE);

    fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onAcknowledge).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Acknowledge" })).toBeInTheDocument();
  });

  it("applies the pure fade function's output as custom properties, not literals", () => {
    render(
      <ul>
        <IssueCard
          issue={{ ...BASE_ISSUE, state: "important", encounterCount: 20 }}
          onDefer={vi.fn()}
          onFlagImportant={vi.fn()}
          onReopen={vi.fn()}
          onAcknowledge={vi.fn()}
          onFocus={vi.fn()}
        />
      </ul>
    );

    const card = screen.getByRole("listitem");
    expect(card.style.getPropertyValue("--issue-opacity")).toBe("1");
    expect(card.style.getPropertyValue("--issue-warning-mix")).toBe("0");
  });
});
