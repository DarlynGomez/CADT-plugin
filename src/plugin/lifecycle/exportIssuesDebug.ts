import { loadIssues } from "../accountability/issueStore";
import { buildDisplayList } from "./issueDisplay";

/**
 * Temporary debugging aid that logs every tracked issue as JSON
 * To remove it delete this file, the manifest menu entry and the export branch in main.ts
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
