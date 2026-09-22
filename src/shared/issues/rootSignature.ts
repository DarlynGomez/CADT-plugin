const SEPARATOR = "|";
const UNBOUND = "unbound";

export interface RootSignatureParts {
  foregroundHex: string;
  backgroundHex: string;
  /** null means unbound; recorded in the signature as the literal "unbound" */
  foregroundBinding: string | null;
  requiredRatio: number;
}

/**
 * The only place a root signature is built or parsed, mirroring issueId.ts for issues.
 * A root's identity is foreground hex, background hex, foreground binding name or
 * "unbound", and the required ratio. The ratio is part of the signature on purpose: two
 * findings with identical colours can carry different thresholds, 4.5 for normal text
 * and 3.0 for large, and grouping them would let a fix that clears one leave the other
 * failing. The background binding is deliberately not part of the signature, only its
 * resolved hex is. See ADR-019 for both.
 */
export function buildRootSignature(parts: RootSignatureParts): string {
  const binding = parts.foregroundBinding ?? UNBOUND;
  return [parts.foregroundHex, parts.backgroundHex, binding, String(parts.requiredRatio)].join(
    SEPARATOR
  );
}

/**
 * The inverse of buildRootSignature. Returns null for a malformed signature rather than
 * throwing, so a bad stored record is skippable, the same convention parseIssueId uses.
 *
 * Foreground and background hex never contain the separator, so the first two segments
 * anchor cleanly from the front. A binding name might, in principle, contain it, so
 * whatever remains between the second and the last separator is taken as the binding
 * whole, the same defensive shape issueId.ts uses for node ids that contain colons.
 */
export function parseRootSignature(signature: string): RootSignatureParts | null {
  const firstSeparator = signature.indexOf(SEPARATOR);
  if (firstSeparator <= 0) {
    return null;
  }

  const secondSeparator = signature.indexOf(SEPARATOR, firstSeparator + 1);
  if (secondSeparator === -1) {
    return null;
  }

  const lastSeparator = signature.lastIndexOf(SEPARATOR);
  if (lastSeparator === secondSeparator || lastSeparator === signature.length - 1) {
    return null;
  }

  const foregroundHex = signature.slice(0, firstSeparator);
  const backgroundHex = signature.slice(firstSeparator + 1, secondSeparator);
  const binding = signature.slice(secondSeparator + 1, lastSeparator);
  const ratioText = signature.slice(lastSeparator + 1);

  if (backgroundHex.length === 0 || binding.length === 0) {
    return null;
  }

  const requiredRatio = Number(ratioText);
  if (!Number.isFinite(requiredRatio)) {
    return null;
  }

  return {
    foregroundHex,
    backgroundHex,
    foregroundBinding: binding === UNBOUND ? null : binding,
    requiredRatio
  };
}
