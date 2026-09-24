import { createChangeBuffer } from "../detection/changeBuffer";
import { isRelevantPropertyChange } from "../detection/relevance";
import { activePreviewNodeIds } from "../adjust/adapter/previewState";
import { scanAndSync } from "./scanAndSync";

/**
 * Wires figma's documentchange event through the pure change buffer and relevance
 * filter to the detection engine, and from there into the issue store. Registered by
 * startup.ts only after figma.loadAllPagesAsync() has resolved; see that file for why
 * the order matters.
 *
 * Every node named by activePreviewNodeIds() is skipped here entirely, even though its
 * fill just changed and fills is a relevant property. Preview is a real write with no
 * Figma overlay to fall back on, and without this exclusion, a single click on a
 * passing option would get picked up by this same listener, rescanned, and resolved
 * before the designer ever chose to keep it, silently removing the issue (and the open
 * Adjust popup with it) out from under them. A group preview, GROUPING_SPEC.md section
 * 8, means this can now be many nodes at once, not only one. Apply clears the tracked
 * preview before its own write, so that write is not skipped, and resolves through this
 * normal path as intended. See ADR-018, ADR-021, and previewState.ts's applyFill.
 */
export function registerDocumentChangeListener(): void {
  const buffer = createChangeBuffer({
    onFlush: (nodeIds) => {
      void scanAndSync(nodeIds, "scan");
    },
    scheduleTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    clearScheduledTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>)
  });

  figma.on("documentchange", (event) => {
    const previewed = activePreviewNodeIds();
    for (const change of event.documentChanges) {
      if (previewed.has(change.id)) {
        continue;
      }
      if (change.type === "CREATE" || change.type === "DELETE") {
        buffer.add(change.id);
        continue;
      }
      if (change.type === "PROPERTY_CHANGE" && isRelevantPropertyChange(change.properties)) {
        buffer.add(change.id);
      }
    }
  });
}
