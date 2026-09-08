import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { isCalibrationProfile, type CalibrationProfile } from "../../shared/calibrationSchema";
import { questions } from "./data/questions";
import { CalibrationFlow } from "./CalibrationFlow";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function startWithKeyboard(user: ReturnType<typeof userEvent.setup>) {
  await user.tab();
  await user.tab();
  await user.keyboard("{Enter}");
  await user.tab();
  await user.tab();
  await user.tab();
  await user.tab();
  await user.keyboard("{Enter}");
}

async function completeSingleQuestion(user: ReturnType<typeof userEvent.setup>) {
  await user.tab();
  await user.keyboard("{ArrowDown}");
  await user.tab();
  await user.tab();
  await user.keyboard("{Enter}");
}

describe("phase 8 calibration behavior", () => {
  it("completes the entire flow with keyboard input and validates the final profile shape", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn<(profile: CalibrationProfile) => boolean>(() => true);

    render(<CalibrationFlow onComplete={onComplete} />);
    await startWithKeyboard(user);
    await completeSingleQuestion(user);
    await completeSingleQuestion(user);

    for (let index = 0; index < 5; index += 1) {
      await user.tab();
      await user.keyboard("{Space}");
    }
    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");

    await completeSingleQuestion(user);
    await completeSingleQuestion(user);
    await completeSingleQuestion(user);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");

    for (let index = 0; index < 7; index += 1) {
      await user.tab();
    }
    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][0]).toMatchObject({
      schemaVersion: 1,
      loggingConsent: false
    });
    expect(Object.keys(onComplete.mock.calls[0][0].answers)).toHaveLength(7);
    expect(isCalibrationProfile(onComplete.mock.calls[0][0])).toBe(true);
  });

  it("preserves a selected multi-choice answer through back navigation", async () => {
    const user = userEvent.setup();

    render(<CalibrationFlow />);
    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.click(screen.getByRole("button", { name: "Continue without logging" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("checkbox", { name: "Bright sunlight or outdoors" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: /Step 2 of 7/ })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("checkbox", { name: "Bright sunlight or outdoors" })).toBeChecked();
  });

  it("renders Q4 defaults when the feature flag is enabled", async () => {
    const question = questions.find(
      (candidate) => candidate.prompt === "Any communities you want extra focus on?"
    );
    if (!question) {
      throw new Error("The community focus question is missing");
    }
    const previousEnabled = question.enabled;
    question.enabled = true;

    try {
      render(<CalibrationFlow />);
      await userEvent.click(screen.getByRole("button", { name: "Skip for now, use defaults" }));
      expect(screen.getAllByRole("button", { name: /^Edit / })).toHaveLength(8);
      await userEvent.click(
        screen.getByRole("button", { name: "Edit Any communities you want extra focus on?" })
      );

      expect(screen.getByRole("checkbox", { name: "No specific focus" })).toBeChecked();
    } finally {
      question.enabled = previousEnabled;
    }
  });

  it("omits disabled questions and changes the runtime denominator", async () => {
    const question = questions.find((candidate) => candidate.prompt === "What are you designing?");
    if (!question) {
      throw new Error("The project type question is missing");
    }
    const previousEnabled = question.enabled;
    question.enabled = false;

    try {
      render(<CalibrationFlow />);
      expect(screen.getByRole("progressbar", { name: "Progress" })).toHaveAttribute("max", "6");
      await userEvent.click(screen.getByRole("button", { name: "Start" }));
      await userEvent.click(screen.getByRole("button", { name: "Continue without logging" }));

      expect(screen.getByRole("heading", { name: /Step 1 of 6/ })).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /What are you designing\?/ })
      ).not.toBeInTheDocument();
    } finally {
      question.enabled = previousEnabled;
    }
  });

  it("completes with declined consent and records false logging consent", async () => {
    const onComplete = vi.fn(() => true);

    render(<CalibrationFlow onComplete={onComplete} />);
    await userEvent.click(screen.getByRole("button", { name: "Skip for now, use defaults" }));
    await userEvent.click(screen.getByRole("button", { name: "Start designing" }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ loggingConsent: false }));
  });

  it("advances and completes when reduced motion is requested", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    });
    const onComplete = vi.fn(() => true);

    render(<CalibrationFlow onComplete={onComplete} />);
    await userEvent.click(screen.getByRole("button", { name: "Skip for now, use defaults" }));
    expect(screen.getByRole("heading", { name: /Here is your setup\./ })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Start designing" }));

    expect(onComplete).toHaveBeenCalledOnce();
  });
});
