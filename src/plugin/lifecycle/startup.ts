import { runDetection } from "../detection/engine";
import { logFindings } from "./logFindings";
import { registerDocumentChangeListener } from "./listeners";
import { resolveTextNodeSnapshot } from "./resolveSnapshot";

function collectTextNodeIds(page: PageNode): Set<string> {
  const textNodes = page.findAllWithCriteria({ types: ["TEXT"] });
  return new Set(textNodes.map((node) => node.id));
}

/** The current page only, a deliberate performance limit, not an oversight. See spec 3.1. */
async function scanCurrentPage(): Promise<void> {
  const nodeIds = collectTextNodeIds(figma.currentPage);
  const findings = await runDetection(nodeIds, resolveTextNodeSnapshot);
  logFindings("initial scan", nodeIds, findings);
}

/**
 * The detection startup sequence. Under documentAccess "dynamic-page",
 * figma.loadAllPagesAsync() must resolve before a documentchange listener is
 * registered; registering it first does not throw, it just never fires, which is the
 * single most common cause of a plugin that silently detects nothing. The order below,
 * load, then listen, then scan, is deliberate and must not be rearranged for
 * convenience.
 */
export async function startDetectionLifecycle(): Promise<void> {
  await figma.loadAllPagesAsync();
  registerDocumentChangeListener();
  await scanCurrentPage();
}
