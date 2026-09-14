import { createChangeBuffer } from "../detection/changeBuffer";
import { isRelevantPropertyChange } from "../detection/relevance";
import { scanAndSync } from "./scanAndSync";

/**
 * Wires figma's documentchange event through the pure change buffer and relevance
 * filter to the detection engine, and from there into the issue store. Registered by
 * startup.ts only after figma.loadAllPagesAsync() has resolved; see that file for why
 * the order matters.
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
    for (const change of event.documentChanges) {
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
