import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Root } from "../../../shared/grouping/groupingTypes";
import { IgnoredTray } from "./IgnoredTray";

function ignoredRoot(signature: string): Root {
  return {
    signature,
    foregroundHex: "#FFFFFF",
    backgroundHex: "#FF6B4A",
    foregroundBinding: null,
    requiredRatio: 4.5,
    instances: [
      {
        issueId: `contrast:${signature}`,
        nodeId: signature,
        nodeName: "Coral banner",
        screenId: "screen:1",
        screenName: "Home",
        state: "ignored",
        severity: "medium",
        measuredRatio: 3.31,
        requiredRatio: 4.5,
        foregroundHex: "#FFFFFF",
        backgroundHex: "#FF6B4A",
        foregroundBinding: null,
        backgroundBinding: null,
        documentOrder: 0
      }
    ],
    representativeIssueId: `contrast:${signature}`,
    backgroundBindings: [],
    displayState: "decided",
    stateBreakdown: { ignored: 1 }
  };
}

function twoInstanceIgnoredRoot(signature: string): Root {
  const one = ignoredRoot(signature);
  return {
    ...one,
    instances: [
      ...one.instances,
      {
        ...one.instances[0],
        issueId: `contrast:${signature}:2`,
        nodeId: `${signature}:2`,
        nodeName: "Coral banner 2",
        documentOrder: 1
      }
    ],
    stateBreakdown: { ignored: 2 }
  };
}

describe("IgnoredTray", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when there are no ignored roots", () => {
    const { container } = render(<IgnoredTray roots={[]} decisions={{}} onRestore={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is collapsed by default and states the count", () => {
    render(
      <IgnoredTray
        roots={[ignoredRoot("1:1")]}
        decisions={{
          "1:1": {
            signature: "1:1",
            reason: "Temporary placeholder",
            recordedAt: "",
            severityAtDecision: "medium"
          }
        }}
        onRestore={vi.fn()}
      />
    );

    expect(screen.getByText("Ignored issues (1)")).toBeInTheDocument();
    const details = screen.getByText("Ignored issues (1)").closest("details");
    expect(details).not.toHaveAttribute("open");
  });

  it("shows the recorded reason and calls onRestore for the right root", () => {
    const onRestore = vi.fn();
    const root = ignoredRoot("1:1");
    render(
      <IgnoredTray
        roots={[root]}
        decisions={{
          "1:1": {
            signature: "1:1",
            reason: "Temporary placeholder",
            recordedAt: "",
            severityAtDecision: "medium"
          }
        }}
        onRestore={onRestore}
      />
    );

    expect(screen.getByText(/Temporary placeholder/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(onRestore).toHaveBeenCalledWith(["contrast:1:1"], "1:1", true);
  });

  it("offers a related-issues disclosure with a checkbox per instance for a grouped root", () => {
    const onRestore = vi.fn();
    render(
      <IgnoredTray roots={[twoInstanceIgnoredRoot("1:1")]} decisions={{}} onRestore={onRestore} />
    );

    expect(screen.getByText("Related grouped issues")).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();

    fireEvent.click(checkboxes[1]);
    fireEvent.click(screen.getByRole("button", { name: /Restore checked/ }));

    expect(onRestore).toHaveBeenCalledWith(["contrast:1:1"], "1:1", false);
  });

  it("clears the decision when every checkbox stays checked for the restore", () => {
    const onRestore = vi.fn();
    render(
      <IgnoredTray roots={[twoInstanceIgnoredRoot("1:1")]} decisions={{}} onRestore={onRestore} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Restore checked/ }));

    expect(onRestore).toHaveBeenCalledWith(["contrast:1:1", "contrast:1:1:2"], "1:1", true);
  });
});
