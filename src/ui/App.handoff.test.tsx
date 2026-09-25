import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

interface OutboundMessage {
  pluginMessage?: { type?: string; profile?: unknown };
}

function respond(message: unknown) {
  window.dispatchEvent(new MessageEvent("message", { data: { pluginMessage: message } }));
}

/** Stand in for the plugin sandbox on the postMessage boundary. */
function fakeSandbox(handlers: {
  onLoad?: () => void;
  onSave?: (profile: unknown) => void;
}) {
  return vi.spyOn(window.parent, "postMessage").mockImplementation((data: unknown) => {
    const message = (data as OutboundMessage)?.pluginMessage;
    if (message?.type === "CALIBRATION_LOAD") {
      setTimeout(() => handlers.onLoad?.(), 0);
    }
    if (message?.type === "CALIBRATION_SAVE") {
      const profile = message.profile;
      setTimeout(() => handlers.onSave?.(profile), 0);
    }
    // The issue panel subscribes as soon as it mounts, right after hand-off.
    if (message?.type === "ISSUES_SUBSCRIBE") {
      setTimeout(() => respond({ type: "ISSUES_UPDATED", issues: [], decisions: {} }), 0);
    }
  });
}

describe("App calibration save and hand-off", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("persists the profile and hands off to the accountability panel", async () => {
    fakeSandbox({
      onLoad: () => respond({ type: "CALIBRATION_LOADED", profile: null, resolvedScope: null }),
      onSave: (profile) => {
        respond({ type: "CALIBRATION_SAVED" });
        respond({ type: "CALIBRATION_LOADED", profile, resolvedScope: "file" });
      }
    });
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Let's set up how CADT works for you." });
    await user.click(screen.getByRole("button", { name: "Skip for now, use defaults" }));
    await user.click(screen.getByRole("button", { name: "Start designing" }));

    await waitFor(() =>
      expect(screen.getByRole("main", { name: "Accessibility issues" })).toBeInTheDocument()
    );
  });

  it("keeps the user on Review with a retry when the save fails", async () => {
    fakeSandbox({
      onLoad: () => respond({ type: "CALIBRATION_LOADED", profile: null, resolvedScope: null }),
      onSave: () =>
        respond({
          type: "CALIBRATION_SAVE_FAILED",
          message: "The setup could not be saved. Check your connection and retry."
        })
    });
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Let's set up how CADT works for you." });
    await user.click(screen.getByRole("button", { name: "Skip for now, use defaults" }));
    await user.click(screen.getByRole("button", { name: "Start designing" }));

    await screen.findByText("The setup could not be saved. Check your connection and retry.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    expect(screen.queryByRole("main", { name: "Accessibility issues" })).not.toBeInTheDocument();
  });
});
