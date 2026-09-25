import { deriveRoots } from "./deriveRoots";
import type { GroupableFinding, Root } from "./groupingTypes";
import { groupByScreen, groupBySeverity } from "./secondaryGrouping";

export type GroupBy = "root-cause" | "screen" | "severity";

export interface RootSection {
  key: string;
  /** Empty for the default root-cause grouping, which renders unsectioned */
  label: string;
  roots: readonly Root[];
}

const SEVERITY_LABELS: Readonly<Record<string, string>> = {
  high: "High",
  medium: "Medium",
  low: "Low"
};

/**
 * GROUPING_SPEC.md 6.2's grouping select. Root cause is deriveRoots over the whole set,
 * unsectioned, exactly as every other view of the panel already works. Screen and
 * severity bucket the flat findings first with the existing pure secondary grouping,
 * then derive roots separately within each bucket, so a root that spans two screens
 * appears once in each screen's section, which is the point of a screen-scoped view.
 */
export function sectionRoots(
  findings: readonly GroupableFinding[],
  groupBy: GroupBy,
  designerSelectionOrder: readonly string[] = []
): RootSection[] {
  if (groupBy === "root-cause") {
    return [{ key: "all", label: "", roots: deriveRoots(findings, designerSelectionOrder) }];
  }

  const secondary = groupBy === "screen" ? groupByScreen(findings) : groupBySeverity(findings);
  return secondary.map((group) => ({
    key: group.key,
    label:
      groupBy === "screen"
        ? (group.instances[0]?.screenName ?? group.key)
        : (SEVERITY_LABELS[group.key] ?? group.key),
    roots: deriveRoots(group.instances, designerSelectionOrder)
  }));
}
