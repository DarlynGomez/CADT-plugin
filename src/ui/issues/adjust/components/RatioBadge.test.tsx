import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { RatioBadge } from "./RatioBadge";

describe("RatioBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows AA for a normal-text ratio below 7:1", () => {
    render(<RatioBadge achievedRatio={5.2} requiredRatio={4.5} />);
    expect(screen.getByText("AA")).toBeInTheDocument();
  });

  it("shows AAA for a normal-text ratio at or above 7:1", () => {
    render(<RatioBadge achievedRatio={7.1} requiredRatio={4.5} />);
    expect(screen.getByText("AAA")).toBeInTheDocument();
  });

  it("shows AAA for a large-text ratio at or above 4.5:1", () => {
    render(<RatioBadge achievedRatio={4.6} requiredRatio={3.0} />);
    expect(screen.getByText("AAA")).toBeInTheDocument();
  });

  it("shows the achieved ratio to two decimal places", () => {
    render(<RatioBadge achievedRatio={5.234} requiredRatio={4.5} />);
    expect(screen.getByText(/5\.23:1/)).toBeInTheDocument();
  });
});
