import type { Root } from "./groupingTypes";

export interface HeadlineBinding {
  /** A binding name, or the hex itself when the foreground is unbound */
  binding: string;
  openCount: number;
}

export type Headline =
  | { kind: "concentrated"; bindings: readonly HeadlineBinding[]; totalOpenCount: number }
  | { kind: "unconcentrated"; totalOpenCount: number; screenCount: number }
  | { kind: "nothingOpen"; decidedRootCount: number };

const COVERAGE_TARGET = 0.8;
const MAX_BINDINGS = 3;

/**
 * Spec section 4: the panel's opening line, computed rather than written. Sort the
 * foreground bindings among open findings by descending count and take the top one, two,
 * or three, whichever first reaches 80 percent. This is not an approximation: when the
 * goal is the fewest items whose counts reach a threshold, taking the largest counts
 * first is provably minimal, so greedy and "smallest number of bindings that together
 * cover 80 percent" describe the same set.
 */
export function computeHeadline(roots: readonly Root[]): Headline {
  const openInstances = roots.flatMap((root) =>
    root.instances.filter((instance) => instance.state === "open")
  );
  const totalOpenCount = openInstances.length;

  if (totalOpenCount === 0) {
    const decidedRootCount = roots.filter((root) => root.displayState === "decided").length;
    return { kind: "nothingOpen", decidedRootCount };
  }

  const countsByBinding = new Map<string, number>();
  for (const instance of openInstances) {
    const key = instance.foregroundBinding ?? instance.foregroundHex;
    countsByBinding.set(key, (countsByBinding.get(key) ?? 0) + 1);
  }

  const sortedBindings = [...countsByBinding.entries()]
    .map(([binding, openCount]): HeadlineBinding => ({ binding, openCount }))
    .sort((a, b) => b.openCount - a.openCount);

  let running = 0;
  const chosen: HeadlineBinding[] = [];
  for (const entry of sortedBindings) {
    if (chosen.length >= MAX_BINDINGS) {
      break;
    }
    chosen.push(entry);
    running += entry.openCount;
    if (running / totalOpenCount >= COVERAGE_TARGET) {
      return { kind: "concentrated", bindings: chosen, totalOpenCount };
    }
  }

  const screenCount = new Set(openInstances.map((instance) => instance.screenName)).size;
  return { kind: "unconcentrated", totalOpenCount, screenCount };
}
