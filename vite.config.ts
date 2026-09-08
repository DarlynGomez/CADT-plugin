import path from "node:path";

import { build } from "esbuild";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

function buildPluginSandbox(): Plugin {
  return {
    name: "build-plugin-sandbox",
    async closeBundle() {
      await build({
        bundle: true,
        entryPoints: [path.resolve("src/plugin/main.ts")],
        format: "iife",
        outfile: path.resolve("dist/code.js"),
        platform: "browser",
        target: "es2022"
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), viteSingleFile(), buildPluginSandbox()],
  build: {
    assetsInlineLimit: Number.POSITIVE_INFINITY,
    outDir: "dist",
    rollupOptions: {
      input: path.resolve("ui.html"),
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
