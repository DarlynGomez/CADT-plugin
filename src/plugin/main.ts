import { handleAdjustMessage } from "./lifecycle/adjustProtocol";
import { isAdjustMessage } from "./lifecycle/isAdjustMessage";
import {
  registerAdjustCloseRestore,
  registerAdjustSelectionRestore
} from "./lifecycle/adjustLifecycle";
import { handleCalibrationMessage, isCalibrationMessage } from "./lifecycle/calibrationProtocol";
// TEMPORARY, see exportIssuesDebug.ts for the removal checklist.
import { exportIssuesToConsole } from "./lifecycle/exportIssuesDebug";
import { handleIssueMessage, isIssueMessage } from "./lifecycle/issuesProtocol";
import { handleRootMessage, isRootMessage } from "./lifecycle/rootActionsProtocol";
import { handleSelectionMessage, isSelectionMessage } from "./lifecycle/selectionProtocol";
import { startDetectionLifecycle } from "./lifecycle/startup";
import { resetCalibration, type CalibrationResetResult } from "./storage/resetCalibration";

const RESET_COMMAND = "reset-calibration";
const EXPORT_ISSUES_COMMAND = "export-issues"; // TEMPORARY, see exportIssuesDebug.ts
const UI_WIDTH = 460;
const UI_HEIGHT = 680;

// figma.ui.postMessage takes the payload directly; Figma delivers it to the UI
// as event.data.pluginMessage. Do not wrap it in { pluginMessage: ... } here.

async function handleUiMessage(rawMessage: unknown): Promise<void> {
  if (!rawMessage || typeof rawMessage !== "object") {
    console.warn("Dropped a plugin message that was not an object", rawMessage);
    return;
  }

  const message = rawMessage as Record<string, unknown>;

  if (isCalibrationMessage(message)) {
    await handleCalibrationMessage(message, (reply) => figma.ui.postMessage(reply));
    return;
  }

  if (isIssueMessage(message)) {
    await handleIssueMessage(message, (reply) => figma.ui.postMessage(reply));
    return;
  }

  if (isRootMessage(message)) {
    await handleRootMessage(message, (reply) => figma.ui.postMessage(reply));
    return;
  }

  if (isSelectionMessage(message)) {
    await handleSelectionMessage(message);
    return;
  }

  if (isAdjustMessage(message)) {
    await handleAdjustMessage(message, (reply) => figma.ui.postMessage(reply));
    return;
  }

  console.warn("Dropped an unrecognized plugin message", message.type);
}

/** Build a notification that names which reset surface failed and why */
function describeResetOutcome(result: CalibrationResetResult): string {
  if (result.fileCleared && result.userCleared) {
    return "Cleared user calibration and file calibration";
  }

  const parts = [
    result.userCleared
      ? "User calibration cleared."
      : `User calibration not cleared: ${result.userError ?? "unknown error"}.`,
    result.fileCleared
      ? "File calibration cleared."
      : `File calibration not cleared: ${result.fileError ?? "unknown error"}.`
  ];
  return parts.join(" ");
}

/** Run the development reset command: clear both surfaces, report the result, then close */
export async function runReset(): Promise<void> {
  try {
    const result = await resetCalibration();
    const fullyCleared = result.fileCleared && result.userCleared;
    figma.notify(describeResetOutcome(result), fullyCleared ? undefined : { error: true });
  } catch (error) {
    console.error("Calibration reset failed unexpectedly", error);
    const message = error instanceof Error && error.message ? error.message : String(error);
    figma.notify(`Reset failed: ${message}`, { error: true });
  } finally {
    figma.closePlugin();
  }
}

/** Normal startup: wire the message router and open the calibration UI */
export function startCalibrationUi(): void {
  figma.ui.onmessage = handleUiMessage;
  figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT });
}

if (figma.command === RESET_COMMAND) {
  void runReset();
} else if (figma.command === EXPORT_ISSUES_COMMAND) {
  void exportIssuesToConsole().finally(() => figma.closePlugin());
} else {
  startCalibrationUi();
  registerAdjustSelectionRestore();
  registerAdjustCloseRestore();
  // Fire-and-forget: the calibration UI does not wait on live detection, and a
  // failure here (a hostile document, a rejected loadAllPagesAsync) must not block it.
  startDetectionLifecycle().catch((error: unknown) => {
    console.error("Detection lifecycle failed to start", error);
  });
}
