import { restorePreview, restorePreviewSync } from "../adjust/adapter/previewState";

/**
 * Restores any active preview on selection change, so exploring one option never
 * leaves a stray mutation behind once the designer moves on to something else
 */
export function registerAdjustSelectionRestore(): void {
  figma.on("selectionchange", () => {
    void restorePreview();
  });
}

/**
 * figma.on("close") cannot await anything, so this calls the synchronous restore path
 * directly rather than the one every other trigger uses. A plugin that closes mid
 * preview and leaves the design modified is the worst outcome this feature can produce
 */
export function registerAdjustCloseRestore(): void {
  figma.on("close", () => {
    restorePreviewSync();
  });
}
