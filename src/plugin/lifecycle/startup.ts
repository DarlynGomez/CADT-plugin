import { registerDocumentChangeListener } from "./listeners";
import { scanAndSync } from "./scanAndSync";
import {
  initializeReEncounterFromCurrentSelection,
  registerSelectionChangeListener
} from "./selectionListener";

function collectTextNodeIds(page: PageNode): Set<string> {
  const textNodes = page.findAllWithCriteria({ types: ["TEXT"] });
  return new Set(textNodes.map((node) => node.id));
}

/** The current page only, a deliberate performance limit, not an oversight. See spec 3.1. */
async function scanCurrentPage(): Promise<void> {
  await scanAndSync(collectTextNodeIds(figma.currentPage), "initial scan");
}

/**
 * The detection startup sequence. Under documentAccess "dynamic-page",
 * figma.loadAllPagesAsync() must resolve before a documentchange listener is
 * registered; registering it first does not throw, it just never fires, which is the
 * single most common cause of a plugin that silently detects nothing. The order below,
 * load, then listen, then scan, is deliberate and must not be rearranged for
 * convenience.
 *
 * The re-encounter guard is initialized from whatever is already selected before the
 * first selectionchange event, so a deferred issue whose node is still selected from a
 * prior session does not resurface the instant the plugin reopens.
 */
export async function startDetectionLifecycle(): Promise<void> {
  await figma.loadAllPagesAsync();
  registerDocumentChangeListener();
  registerSelectionChangeListener();
  await initializeReEncounterFromCurrentSelection();
  await scanCurrentPage();
}
