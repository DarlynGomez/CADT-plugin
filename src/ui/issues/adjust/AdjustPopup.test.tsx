import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Root } from "../../../shared/grouping/groupingTypes";
import type { IssueSummary } from "../../../shared/issues/issueTypes";
import { AdjustPopup } from "./AdjustPopup";

function emit(message: unknown) {
  window.dispatchEvent(new MessageEvent("message", { data: { pluginMessage: message } }));
}

const ISSUE: IssueSummary = {
  id: "contrast:1:1",
  ruleId: "contrast",
  nodeId: "1:1",
  nodeName: "Body copy",
  state: "open",
  severityAtLastDetection: "high",
  encounterCount: 0,
  lastDetectedAt: "2026-09-08T00:00:00.000Z",
  evidence: {
    measuredRatio: 2.0,
    requiredRatio: 4.5,
    foregroundHex: "#AAAAAA",
    backgroundHex: "#FFFFFF"
  }
};

function rootFor(issueId: string, extraInstances = 0): Root {
  const instances = [
    {
      issueId,
      nodeId: "1:1",
      nodeName: "Body copy",
      screenId: "screen:1",
      screenName: "Home",
      state: "open" as const,
      severity: "high" as const,
      measuredRatio: 2.0,
      requiredRatio: 4.5,
      foregroundHex: "#AAAAAA",
      backgroundHex: "#FFFFFF",
      foregroundBinding: null,
      backgroundBinding: null,
      documentOrder: 0
    },
    ...Array.from({ length: extraInstances }, (_unused, index) => ({
      issueId: `contrast:${index + 2}:${index + 2}`,
      nodeId: `${index + 2}:${index + 2}`,
      nodeName: `Body copy ${index + 2}`,
      screenId: "screen:1",
      screenName: "Home",
      state: "open" as const,
      severity: "high" as const,
      measuredRatio: 2.0,
      requiredRatio: 4.5,
      foregroundHex: "#AAAAAA",
      backgroundHex: "#FFFFFF",
      foregroundBinding: null,
      backgroundBinding: null,
      documentOrder: index + 1
    }))
  ];
  return {
    signature: "sig:1",
    foregroundHex: "#AAAAAA",
    backgroundHex: "#FFFFFF",
    foregroundBinding: null,
    requiredRatio: 4.5,
    instances,
    representativeIssueId: issueId,
    backgroundBindings: [],
    displayState: "open",
    stateBreakdown: { open: instances.length }
  };
}

function postedMessages(posted: unknown[]) {
  return posted.filter(
    (message): message is { type: string } =>
      typeof message === "object" && message !== null && "type" in message
  );
}

describe("AdjustPopup", () => {
  let posted: unknown[] = [];

  beforeEach(() => {
    posted = [];
    vi.spyOn(window.parent, "postMessage").mockImplementation((message) => {
      posted.push((message as { pluginMessage: unknown }).pluginMessage);
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("previews the first option immediately at level 4, so Apply is not stuck disabled", () => {
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={4}
        onClose={vi.fn()}
      />
    );

    const previews = postedMessages(posted).filter((message) => message.type === "ADJUST_PREVIEW");
    expect(previews).toHaveLength(1);
    expect(previews[0]).toMatchObject({ issueId: ISSUE.id, issueIds: [ISSUE.id] });
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("does not preview anything automatically at level 3", () => {
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={3}
        onClose={vi.fn()}
      />
    );

    const previews = postedMessages(posted).filter((message) => message.type === "ADJUST_PREVIEW");
    expect(previews).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("opens directly into the wheel at level 2, with no option cards", () => {
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={2}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText("Keep your colour")).not.toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /colour wheel/i })).toBeInTheDocument();
  });

  it("shows all three option entry points at level 3", () => {
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={3}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Keep your colour")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compliant color wheel/i })).toBeInTheDocument();
  });

  it("shows a close button and the node name in the header", () => {
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={3}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Body copy/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("closes without applying when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={3}
        onClose={onClose}
      />
    );

    screen.getByRole("button", { name: "Close" }).click();

    expect(postedMessages(posted).filter((m) => m.type === "ADJUST_ABANDONED")).toHaveLength(0);
    expect(onClose).toHaveBeenCalled();
  });

  it("restores the original colour, logs the abandonment, and closes on Cancel", () => {
    const onClose = vi.fn();
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={3}
        onClose={onClose}
      />
    );

    screen.getByRole("button", { name: "Cancel" }).click();

    expect(postedMessages(posted).filter((m) => m.type === "ADJUST_CLEAR_PREVIEW")).toHaveLength(1);
    expect(postedMessages(posted).filter((m) => m.type === "ADJUST_ABANDONED")).toHaveLength(1);
    expect(onClose).toHaveBeenCalled();
  });

  it("scopes preview and apply to the representative alone when nothing is selected", () => {
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id, 2)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={4}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Changes 1 layer\./)).toBeInTheDocument();
    expect(screen.getByText(/2 more in this group left unchanged/)).toBeInTheDocument();
    const previews = postedMessages(posted).filter((message) => message.type === "ADJUST_PREVIEW");
    expect(previews[0]).toMatchObject({ issueIds: [ISSUE.id] });
  });

  it("scopes preview and apply to the checked instances when some are selected", () => {
    const selected = new Set(["contrast:2:2", "contrast:3:3"]);
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id, 2)}
        representativeIssue={ISSUE}
        selectedInstanceIds={selected}
        aiAssistanceLevel={4}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Changes 2 layers\./)).toBeInTheDocument();
    const previews = postedMessages(posted).filter((message) => message.type === "ADJUST_PREVIEW");
    expect(previews[0]).toMatchObject({ issueIds: ["contrast:2:2", "contrast:3:3"] });
  });

  it("makes every option reachable and selectable by keyboard, all three once the palette arrives", async () => {
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={3}
        onClose={vi.fn()}
      />
    );
    await act(async () => {
      emit({
        type: "ADJUST_OPTIONS_READY",
        issueId: ISSUE.id,
        palette: [{ color: { r: 0, g: 0, b: 0.3 }, name: "ink/deep" }],
        binding: null
      });
    });

    const keepTile = screen.getByText("Keep your colour").closest("button");
    const fileTile = screen.getByText("From your file").closest("button");
    const wheelTile = screen.getByRole("button", { name: /compliant color wheel/i });
    expect(keepTile).not.toBeNull();
    expect(fileTile).not.toBeNull();

    keepTile?.focus();
    expect(keepTile).toHaveFocus();
    fireEvent.click(keepTile as HTMLElement);
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();

    fileTile?.focus();
    expect(fileTile).toHaveFocus();

    wheelTile.focus();
    expect(wheelTile).toHaveFocus();
  });

  it("leaves Apply disabled while a typed hex fails contrast, and re-enables it for the nearest alternative", () => {
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={2}
        onClose={vi.fn()}
      />
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Type a hex colour" }), {
      target: { value: "#eeeeee" }
    });
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /nearest passing colour/i }));
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("Escape clears the preview without closing the popup", () => {
    const onClose = vi.fn();
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={4}
        onClose={onClose}
      />
    );

    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
    fireEvent.keyDown(screen.getByText("Keep your colour"), { key: "Escape" });

    expect(postedMessages(posted).filter((m) => m.type === "ADJUST_CLEAR_PREVIEW")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escape collapses the wheel back into the third option card", () => {
    render(
      <AdjustPopup
        root={rootFor(ISSUE.id)}
        representativeIssue={ISSUE}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={3}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /compliant color wheel/i }));
    expect(screen.getByRole("slider", { name: /colour wheel/i })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("slider", { name: /colour wheel/i }), { key: "Escape" });

    expect(screen.queryByRole("slider", { name: /colour wheel/i })).not.toBeInTheDocument();
    expect(screen.getByText("Keep your colour")).toBeInTheDocument();
  });

  it("shows a diagnostic message instead of an empty sheet when evidence cannot be read", () => {
    const brokenIssue: IssueSummary = { ...ISSUE, evidence: { requiredRatio: 4.5 } };
    render(
      <AdjustPopup
        root={rootFor(brokenIssue.id)}
        representativeIssue={brokenIssue}
        selectedInstanceIds={new Set()}
        aiAssistanceLevel={3}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/could not be read/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
