import { resolveCalibration } from "../../storage/calibrationStore";
import { STORAGE_KEY_ADJUST_LOG } from "../../storage/storageKeys";

/**
 * One recorded Adjust event, per ADJUST_SPEC.md section 9. This is study data, not
 * telemetry: abandonment matters as much as adoption, so the entry exists whether or
 * not the designer applied anything
 */
export interface AdjustLogEntry {
  issueId: string;
  optionChosen: "a" | "b" | "c" | null;
  beforeHex: string;
  beforeRatio: number;
  afterHex: string | null;
  afterRatio: number | null;
  wasBound: boolean;
  wheelOpened: boolean;
  hexRejected: boolean;
  abandoned: boolean;
  /** How many nodes this event covered. GROUPING_SPEC.md section 8: logged once per group apply */
  instanceCount: number;
  loggedAt: string;
}

function readLog(): AdjustLogEntry[] {
  try {
    const raw = figma.root.getPluginData(STORAGE_KEY_ADJUST_LOG);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdjustLogEntry[]) : [];
  } catch (error) {
    console.error("adjustLogging: stored log was not valid JSON", error);
    return [];
  }
}

/** Only when loggingConsent is true; a silent no-op otherwise, never an error */
export async function logAdjustEvent(entry: AdjustLogEntry): Promise<void> {
  const resolution = await resolveCalibration();
  if (!resolution?.profile.loggingConsent) {
    return;
  }

  const log = readLog();
  log.push(entry);
  try {
    figma.root.setPluginData(STORAGE_KEY_ADJUST_LOG, JSON.stringify(log));
  } catch (error) {
    console.error("logAdjustEvent: figma.root.setPluginData failed", error);
  }
}
