import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CalibrationFlow } from "./CalibrationFlow";

describe("CalibrationFlow", () => {
  afterEach(() => {
    cleanup();
  });

  it("fills defaults and completes through the skip path", () => {
    const onComplete = vi.fn();

    render(<CalibrationFlow onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip for now, use defaults" }));

    expect(screen.getByRole("heading", { name: /Here is your setup\./ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Edit / })).toHaveLength(7);

    fireEvent.click(screen.getByRole("button", { name: "Start designing" }));

    expect(onComplete).toHaveBeenCalledOnce();
    expect(Object.keys(onComplete.mock.calls[0][0].answers)).toHaveLength(7);
    expect(onComplete.mock.calls[0][0].loggingConsent).toBe(false);
    expect(onComplete.mock.calls[0][0]).not.toHaveProperty("scope");
  });

  it("navigates through enabled questions and returns to Review after editing", () => {
    render(<CalibrationFlow />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue without logging" }));

    expect(
      screen.getByRole("heading", { name: /Step 1 of 7.*What are you designing\?/ })
    ).toHaveFocus();

    fireEvent.click(screen.getByRole("radio", { name: "Something else" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    fireEvent.click(screen.getByRole("radio", { name: "A specialized group" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("radio", { name: "Another plugin" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("radio", { name: "Some experience" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(
      screen.getByRole("radio", { name: "Show me the fix now, details available later" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: /Here is your setup\./ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit What are you designing?" }));
    expect(screen.getByRole("heading", { name: /What are you designing\?/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: /Here is your setup\./ })).toBeInTheDocument();
  });

  it("walks Change something from question one through to Review", () => {
    render(<CalibrationFlow />);
    fireEvent.click(screen.getByRole("button", { name: "Skip for now, use defaults" }));
    expect(screen.getByRole("heading", { name: /Here is your setup\./ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Change something" }));
    expect(
      screen.getByRole("heading", { name: /Step 1 of 7.*What are you designing\?/ })
    ).toBeInTheDocument();

    for (let step = 1; step < 7; step += 1) {
      expect(
        screen.getByRole("heading", { name: new RegExp(`Step ${step} of 7`) })
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    }

    expect(screen.getByRole("heading", { name: /Step 7 of 7/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: /Here is your setup\./ })).toBeInTheDocument();
  });

  it("uses native controls and moves focus to each new step heading", () => {
    render(<CalibrationFlow />);
    expect(screen.getByRole("progressbar", { name: "Progress" })).toHaveValue(0);
    expect(screen.getByRole("progressbar", { name: "Progress" })).toHaveAttribute("max", "7");
    expect(
      screen.getByRole("heading", { name: "Let's set up how CADT works for you." })
    ).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByRole("heading", { name: "Can we log how you use CADT?" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Continue without logging" }));
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: /Step 1 of 7/ })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    expect(screen.getByRole("heading", { name: /Step 3 of 7/ })).toHaveFocus();

    for (const checkbox of screen.getAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "2" } });
    expect(
      screen.getByRole("slider", { name: "How much should CADT do on its own?" })
    ).toHaveAttribute("aria-valuetext", "Flag and explain");
    expect(screen.getByRole("heading", { name: /Step 7 of 7/ })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("progressbar", { name: "Progress" })).toHaveValue(7);
    expect(screen.getByRole("heading", { name: "Here is your setup." })).toHaveFocus();
  });
});
