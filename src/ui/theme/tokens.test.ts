import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { TOKEN_VALUES } from "./tokens";

const THEME_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const GLOBAL_CSS_PATH = path.join(THEME_DIRECTORY, "global.css");

function readRootDeclarations(css: string): Record<string, string> {
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\n\}/);

  if (!rootMatch) {
    throw new Error("global.css must contain a :root token block.");
  }

  return Object.fromEntries(
    [...rootMatch[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim()
    ])
  );
}

describe("theme token synchronization", () => {
  it("keeps global.css and tokens.ts aligned on every shared value", () => {
    const cssTokens = readRootDeclarations(readFileSync(GLOBAL_CSS_PATH, "utf8"));

    expect(cssTokens).toEqual(TOKEN_VALUES);
  });
});
