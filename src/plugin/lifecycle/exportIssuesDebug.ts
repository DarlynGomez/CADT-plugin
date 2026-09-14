import { loadIssues } from "../accountability/issueStore";
import { buildDisplayList } from "./issueDisplay";

/**
 * TEMPORARY debugging aid, not a feature. Dumps every tracked issue, in the same
 * enriched shape (node name and live evidence included) the panel itself receives,
 * to the console as JSON, for manually inspecting findings while developing.
 *
 * Removal checklist once debugging is done: delete this file, the "Export issues
 * JSON (dev, temporary)" entry in manifest.json's menu, and the EXPORT_COMMAND
 * branch in main.ts.
 */
export async function exportIssuesToConsole(): Promise<void> {
  try {
    const issues = await buildDisplayList(await loadIssues());
    console.log(`[CADT] issue export (${issues.length})`, JSON.stringify(issues, null, 2));
    figma.notify(`Exported ${issues.length} issue(s) to the console`);
  } catch (error) {
    console.error("Issue export failed", error);
    figma.notify("Issue export failed, see console", { error: true });
  }
}
