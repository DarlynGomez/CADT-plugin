import { describe, expect, it } from "vitest";

import { classifyTextSize, isBoldStyleName } from "./textSizeClass";

describe("isBoldStyleName", () => {
  it.each(["Bold", "Extra Bold", "Black", "Heavy", "Ultra", "Ultra Bold"])(
    "treats %s as bold",
    (styleName) => {
      expect(isBoldStyleName(styleName)).toBe(true);
    }
  );

  it.each([
    "Regular",
    "Medium",
    "Light",
    "Condensed Italic",
    "Semibold",
    "SEMIBOLD",
    "Semi Bold",
    "SEMI BOLD",
    "Demibold",
    "Demi",
    "Demi Bold",
    "Book"
  ])("does not treat %s as bold, since it sits below WCAG's 700-weight floor", (styleName) => {
    expect(isBoldStyleName(styleName)).toBe(false);
  });
});

describe("classifyTextSize", () => {
  it("is normal just below the 24px regular-weight floor", () => {
    expect(classifyTextSize(23.99, false)).toBe("normal");
  });

  it("is large exactly at the 24px regular-weight floor", () => {
    expect(classifyTextSize(24, false)).toBe("large");
  });

  it("is normal just below the 18.66px bold floor", () => {
    expect(classifyTextSize(18.65, true)).toBe("normal");
  });

  it("is large exactly at the 18.66px bold floor", () => {
    expect(classifyTextSize(18.66, true)).toBe("large");
  });

  it("does not grant the bold floor to non-bold text", () => {
    expect(classifyTextSize(18.66, false)).toBe("normal");
  });

  it("is large above the bold floor even without needing the regular floor", () => {
    expect(classifyTextSize(20, true)).toBe("large");
  });

  it("is normal at the 18.66px bold floor for Semibold, which does not meet the 700-weight bold definition", () => {
    expect(classifyTextSize(18.66, isBoldStyleName("Semibold"))).toBe("normal");
  });

  it("is normal at 23px for Semibold, the last whole pixel before the weight-independent 24px floor", () => {
    expect(classifyTextSize(23, isBoldStyleName("Semibold"))).toBe("normal");
  });

  it("is large at the 24px regular floor for Semibold, since that floor applies regardless of weight", () => {
    expect(classifyTextSize(24, isBoldStyleName("Semibold"))).toBe("large");
  });
});
