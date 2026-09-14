import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules"]
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["**/*.{ts,tsx}", "**/*.js"],
    rules: {
      "no-restricted-imports": "error",
      "@typescript-eslint/no-explicit-any": "error"
    }
  },
  {
    files: ["src/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../plugin/**", "../../plugin/**", "../../../plugin/**"],
              message: "The UI cannot import from the Figma plugin sandbox."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/plugin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../ui/**", "../../ui/**", "../../../ui/**"],
              message: "The plugin sandbox cannot import from the UI iframe."
            }
          ]
        }
      ]
    }
  },
  {
    // @figma/plugin-typings is loaded globally via tsconfig "types", so nothing ever
    // imports it; restricting an import statement would never fire. The real boundary
    // is the ambient `figma` global itself, so that is what CI checks. See CLAUDE.md
    // rule 8 and docs/ENGINEERING_STANDARDS.md section 7.2.
    files: ["src/plugin/detection/**/*.{ts,tsx}"],
    ignores: ["src/plugin/detection/adapter/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "figma",
          message:
            "Detection code is pure and must not touch the Figma API. Only src/plugin/detection/adapter/** may."
        }
      ]
    }
  }
);
