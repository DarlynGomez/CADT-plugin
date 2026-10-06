const SEPARATOR = "|";
const UNBOUND = "unbound";

export interface RootSignatureParts {
  foregroundHex: string;
  backgroundHex: string;
  /** null means unbound and is stored as the word unbound */
  foregroundBinding: string | null;
  requiredRatio: number;
}

/**
 * Identity is both hex values, the foreground binding and the required ratio
 * Ratio keeps normal and large text apart, background binding is left out on purpose
 */
export function buildRootSignature(parts: RootSignatureParts): string {
  const binding = parts.foregroundBinding ?? UNBOUND;
  return [parts.foregroundHex, parts.backgroundHex, binding, String(parts.requiredRatio)].join(
    SEPARATOR
  );
}

/**
 * Inverse of buildRootSignature, null when malformed so a bad record can be skipped
 * A binding name may contain the separator so it is taken whole
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
