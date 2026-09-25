import { describe, expect, it } from "vitest";

import { passLevel } from "./passLevel";

describe("passLevel", () => {
  it("returns AA when below the AAA threshold for normal text", () => {
    expect(passLevel(4.6, 4.5)).toBe("AA");
  });

  it("returns AAA at or above 7.0 for normal text", () => {
    expect(passLevel(7.0, 4.5)).toBe("AAA");
  });

  it("uses the large text AAA threshold of 4.5 when requiredRatio is 3.0", () => {
    expect(passLevel(4.5, 3.0)).toBe("AAA");
    expect(passLevel(4.4, 3.0)).toBe("AA");
  });
});
