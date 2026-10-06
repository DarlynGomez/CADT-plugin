import type { BackgroundSource } from "./issueTypes";

// Narrow view of the evidence, kept in shared because the popup and grouping both read it

export interface ContrastEvidenceView {
  foregroundHex: string;
  backgroundHex: string;
  requiredRatio: number;
  measuredRatio: number;
  /** Null when unbound, undefined when unknown */
  foregroundBinding: string | null | undefined;
  /** Undefined when unknown */
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

/** Also used for the wheel callout */
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
