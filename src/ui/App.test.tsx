import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CalibrationProfile } from "../shared/calibrationSchema";
import { App } from "./App";
import { useCalibrationPersistence } from "./hooks/useCalibrationPersistence";

vi.mock("./hooks/useCalibrationPersistence", () => ({
  useCalibrationPersistence: vi.fn()
}));

const mockedHook = vi.mocked(useCalibrationPersistence);

const profile: CalibrationProfile = {
  schemaVersion: 1,
  completedAt: "2026-09-08T00:00:00.000Z",
  loggingConsent: false,
  answers: { example: "value" }
};

function hookState(overrides: Partial<ReturnType<typeof useCalibrationPersistence>>) {
  mockedHook.mockReturnValue({
    loadedProfile: null,
    loading: false,
    resolvedScope: null,
    saveProfile: vi.fn(),
    saveError: null,
    ...overrides
  });
}

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("falls back to first run calibration when the load produced no profile", () => {
    hookState({ loadedProfile: null, resolvedScope: null });

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Let's set up how CADT works for you." })
    ).toBeInTheDocument();
  });

  it("hands off to the returning-user screen as soon as a profile resolves, before scope catches up", () => {
    hookState({ loadedProfile: profile, resolvedScope: null });

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Temporary returning-user screen" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Resolved storage scope: not yet resolved/)).toBeInTheDocument();
  });

  it("shows the returning user screen with the resolved scope when both are present", () => {
    hookState({ loadedProfile: profile, resolvedScope: "file" });

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Temporary returning-user screen" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Resolved storage scope: file/)).toBeInTheDocument();
  });
});
