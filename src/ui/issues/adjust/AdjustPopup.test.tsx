import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    render(<AdjustPopup issue={ISSUE} aiAssistanceLevel={4} onClose={vi.fn()} />);

    const previews = postedMessages(posted).filter((message) => message.type === "ADJUST_PREVIEW");
    expect(previews).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("does not preview anything automatically at level 3", () => {
    render(<AdjustPopup issue={ISSUE} aiAssistanceLevel={3} onClose={vi.fn()} />);

    const previews = postedMessages(posted).filter((message) => message.type === "ADJUST_PREVIEW");
    expect(previews).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("opens directly into the wheel at level 2, with no tiles", () => {
    render(<AdjustPopup issue={ISSUE} aiAssistanceLevel={2} onClose={vi.fn()} />);

    expect(screen.queryByText("Keep your colour")).not.toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /colour wheel/i })).toBeInTheDocument();
  });

  it("shows all three tiles' entry points at level 3", () => {
    render(<AdjustPopup issue={ISSUE} aiAssistanceLevel={3} onClose={vi.fn()} />);

    expect(screen.getByText("Keep your colour")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose your own/i })).toBeInTheDocument();
  });

  it("restores the original colour, logs the abandonment, and closes on Cancel", () => {
    const onClose = vi.fn();
    render(<AdjustPopup issue={ISSUE} aiAssistanceLevel={3} onClose={onClose} />);

    screen.getByRole("button", { name: "Cancel" }).click();

    expect(postedMessages(posted).filter((m) => m.type === "ADJUST_CLEAR_PREVIEW")).toHaveLength(1);
    expect(postedMessages(posted).filter((m) => m.type === "ADJUST_ABANDONED")).toHaveLength(1);
    expect(onClose).toHaveBeenCalled();
  });

  it("makes every tile reachable and selectable by keyboard, all three once the palette arrives", async () => {
    render(<AdjustPopup issue={ISSUE} aiAssistanceLevel={3} onClose={vi.fn()} />);
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
    const wheelTile = screen.getByRole("button", { name: /choose your own/i });
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
    render(<AdjustPopup issue={ISSUE} aiAssistanceLevel={2} onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Type a hex colour" }), {
      target: { value: "#eeeeee" }
    });
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /nearest passing colour/i }));
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("Escape clears the preview without closing the popup", () => {
    const onClose = vi.fn();
    render(<AdjustPopup issue={ISSUE} aiAssistanceLevel={4} onClose={onClose} />);

    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
    fireEvent.keyDown(screen.getByText("Keep your colour"), { key: "Escape" });

    expect(postedMessages(posted).filter((m) => m.type === "ADJUST_CLEAR_PREVIEW")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escape returns to tiles when the wheel view is open", () => {
    render(<AdjustPopup issue={ISSUE} aiAssistanceLevel={3} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /choose your own/i }));
    expect(screen.getByRole("slider", { name: /colour wheel/i })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("slider", { name: /colour wheel/i }), { key: "Escape" });

    expect(screen.queryByRole("slider", { name: /colour wheel/i })).not.toBeInTheDocument();
    expect(screen.getByText("Keep your colour")).toBeInTheDocument();
  });
});
