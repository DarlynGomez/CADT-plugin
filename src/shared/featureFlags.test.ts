import { describe, expect, it } from "vitest";

import { FEATURE_VARIABLE_SCOPE } from "./featureFlags";

describe("feature flag defaults", () => {
  it("leaves variable scope off unless a build or test turns it on", () => {
    expect(FEATURE_VARIABLE_SCOPE).toBe(false);
  });
});
