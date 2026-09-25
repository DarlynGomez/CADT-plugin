import type { BackgroundSource } from "./issueTypes";

// A local, narrowed view of contrast's evidence rather than importing the plugin-side
// ContrastEvidence type, since IssueSummary.evidence stays unknown at the shared spine
// on purpose, see ADR-016. Lives in shared/, not ui/, because both the UI (AdjustPopup)
// and the pure root-grouping assembly need the same reader.

export interface ContrastEvidenceView {
  foregroundHex: string;
  backgroundHex: string;
  requiredRatio: number;
  measuredRatio: number;
  /** GROUPING_SPEC.md 3.1's signature field. Null when unbound, undefined when unknown */
  foregroundBinding: string | null | undefined;
  /** For the Details disclosure, GROUPING_SPEC.md 6.3 item 7. Undefined when unknown */
  fontSizePx: number | undefined;
  isBold: boolean | undefined;
  backgroundSource: BackgroundSource | undefined;
}

function readBackgroundSource(value: unknown): BackgroundSource | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const source = value as Record<string, unknown>;
  if (source.kind === "page") {
    return { kind: "page" };
  }
  if (
    source.kind === "node" &&
    typeof source.nodeId === "string" &&
    typeof source.nodeName === "string"
  ) {
    return { kind: "node", nodeId: source.nodeId, nodeName: source.nodeName };
  }
  return undefined;
}

/** Also used by AdjustPopup's wheel chrome for the background-ancestor callout */
export function backgroundSourceName(evidence: ContrastEvidenceView | null): string {
  const source = evidence?.backgroundSource;
  if (!source) {
    return "Unknown";
  }
  return source.kind === "page" ? "Page background" : source.nodeName;
}

export function readContrastEvidence(
  ruleId: string,
  evidence: unknown
): ContrastEvidenceView | null {
  if (ruleId !== "contrast" || !evidence || typeof evidence !== "object") {
    return null;
  }
  const fields = evidence as Record<string, unknown>;
  if (
    typeof fields.foregroundHex !== "string" ||
    typeof fields.backgroundHex !== "string" ||
    typeof fields.requiredRatio !== "number" ||
    typeof fields.measuredRatio !== "number"
  ) {
    return null;
  }
  const binding = fields.foregroundBinding;
  return {
    foregroundHex: fields.foregroundHex,
    backgroundHex: fields.backgroundHex,
    requiredRatio: fields.requiredRatio,
    measuredRatio: fields.measuredRatio,
    foregroundBinding: binding === null || typeof binding === "string" ? binding : undefined,
    fontSizePx: typeof fields.fontSizePx === "number" ? fields.fontSizePx : undefined,
    isBold: typeof fields.isBold === "boolean" ? fields.isBold : undefined,
    backgroundSource: readBackgroundSource(fields.backgroundSource)
  };
}
