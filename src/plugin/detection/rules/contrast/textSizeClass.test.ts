import { describe, expect, it } from "vitest";

import { classifyTextSize, isBoldStyleName } from "./textSizeClass";

describe("isBoldStyleName", () => {
  it.each(["Bold", "Extra Bold", "Black", "Heavy", "Semibold", "SEMIBOLD"])(
    "treats %s as bold",
    (styleName) => {
      expect(isBoldStyleName(styleName)).toBe(true);
    }
  );

  it.each(["Regular", "Medium", "Light", "Condensed Italic"])(
    "does not treat %s as bold",
    (styleName) => {
      expect(isBoldStyleName(styleName)).toBe(false);
    }
  );
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
});
