import { createChangeBuffer } from "../detection/changeBuffer";
import { runDetection } from "../detection/engine";
import { isRelevantPropertyChange } from "../detection/relevance";
import { logFindings } from "./logFindings";
import { resolveTextNodeSnapshot } from "./resolveSnapshot";

/**
 * Wires figma's documentchange event through the pure change buffer and relevance
 * filter to the detection engine. Registered by startup.ts only after
 * figma.loadAllPagesAsync() has resolved; see that file for why the order matters.
 * Console output only, phase 11 has no UI and no persistence yet.
 */
export function registerDocumentChangeListener(): void {
  const buffer = createChangeBuffer({
    onFlush: (nodeIds) => {
      void runDetection(nodeIds, resolveTextNodeSnapshot).then((findings) => {
        logFindings("scan", nodeIds, findings);
      });
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
