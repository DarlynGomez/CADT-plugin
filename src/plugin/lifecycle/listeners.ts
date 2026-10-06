import { createChangeBuffer } from "../detection/changeBuffer";
import { isRelevantPropertyChange } from "../detection/relevance";
import { activePreviewNodeIds } from "../adjust/adapter/previewState";
import { scanAndSync } from "./scanAndSync";

/**
 * Wires documentchange through the buffer and filter into detection and the issue store
 * Registered only after loadAllPagesAsync resolves, otherwise the listener never fires
 * Nodes under an active preview are skipped so a preview is not rescanned
 * and resolved before the designer chooses to keep it
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
