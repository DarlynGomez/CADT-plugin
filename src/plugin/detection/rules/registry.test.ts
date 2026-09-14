import { describe, expect, it } from "vitest";

import { RULES } from "./registry";

describe("RULES", () => {
  it("registers exactly the contrast rule today", () => {
    expect(RULES.map((rule) => rule.id)).toEqual(["contrast"]);
  });
});
