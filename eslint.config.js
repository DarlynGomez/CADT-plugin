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
    //
    // Phase 11 broadens this from detection/** to all of src/plugin/**, now that the
    // detection startup sequence (loadAllPagesAsync, listener registration, the initial
    // scan) has moved out of main.ts into lifecycle/. main.ts itself stays an explicit
    // exception rather than being forced pure: it is the plugin's entry point and still
    // legitimately owns the pre-existing calibration UI wiring (figma.ui.onmessage,
    // showUI, notify, closePlugin), which was never part of this slice's purity claim.
    // Phase 12 adds accountability/** to this restricted set (already implied by the
    // src/plugin/** glob below; the actual change is issueStore.ts joining the
    // exceptions, since it is a storage surface, not a pure module). Phase 13 adds
    // src/ui/issues/fade.ts to a UI-side rule. Each is a deliverable of its phase.
    files: ["src/plugin/**/*.{ts,tsx}"],
    ignores: [
      "src/plugin/detection/adapter/**/*.{ts,tsx}",
      "src/plugin/storage/**/*.{ts,tsx}",
      "src/plugin/lifecycle/**/*.{ts,tsx}",
      "src/plugin/accountability/issueStore.ts",
      "src/plugin/main.ts"
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "figma",
          message:
            "This module must stay pure. Only the adapter, storage, lifecycle, or issueStore layers may touch the Figma API."
        }
      ],
      // The globals rule alone misses a pure-looking module that accepts a
      // Figma-typed value as a parameter and reads properties off it without ever
      // referencing the `figma` global itself; its test would then need a Figma
      // mock while still passing the rule above. This bans the type names, not
      // just the global, closing that gap. List covers the ambient types the
      // adapter and lifecycle touch today (BaseNode, PageNode, Paint, SolidPaint,
      // BlendMode, RGB) plus the node types most likely to appear by copy-paste
      // (SceneNode, TextNode, FrameNode); extend it if a new one shows up.
      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            SceneNode: "Figma node type. Only the adapter or lifecycle layers may reference it.",
            TextNode: "Figma node type. Only the adapter or lifecycle layers may reference it.",
            FrameNode: "Figma node type. Only the adapter or lifecycle layers may reference it.",
            PageNode: "Figma node type. Only the adapter or lifecycle layers may reference it.",
            BaseNode: "Figma node type. Only the adapter or lifecycle layers may reference it.",
            Paint: "Figma paint type. Only the adapter or lifecycle layers may reference it.",
            SolidPaint: "Figma paint type. Only the adapter or lifecycle layers may reference it.",
            BlendMode: "Figma type. Only the adapter or lifecycle layers may reference it.",
            RGB: "Figma color type. Use the shared RGBColor plain type instead."
          }
        }
      ]
    }
  }
);
