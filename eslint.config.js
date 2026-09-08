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
  }
);
