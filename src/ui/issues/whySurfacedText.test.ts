import { describe, expect, it } from "vitest";
import { whySurfacedContext } from "./whySurfacedText";

describe("whySurfacedContext", () => {
  it("names low vision and bright light for high severity", () => {
    expect(whySurfacedContext("high")).toContain("low vision");
  });

  it("gives a distinct sentence per band", () => {
    const texts = new Set(
      (["high", "medium", "low"] as const).map((severity) => whySurfacedContext(severity))
    );
    expect(texts.size).toBe(3);
  });

  it("never cites a WCAG success criterion number, per the no-jargon rule", () => {
    for (const severity of ["high", "medium", "low"] as const) {
      expect(whySurfacedContext(severity)).not.toMatch(/\d\.\d\.\d/);
    }
  });
});
