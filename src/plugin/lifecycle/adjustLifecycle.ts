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
 * The close handler cannot await so it calls the sync restore directly
 * A plugin closing mid preview and leaving the design changed is the worst outcome here
 */
export function registerAdjustCloseRestore(): void {
  figma.on("close", () => {
    restorePreviewSync();
  });
}
