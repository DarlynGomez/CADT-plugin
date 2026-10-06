import { deriveRoots } from "./deriveRoots";
import type { GroupableFinding, Root } from "./groupingTypes";
import { groupByScreen, groupBySeverity } from "./secondaryGrouping";

export type GroupBy = "root-cause" | "screen" | "severity";

export interface RootSection {
  key: string;
  /** Empty for root cause grouping, which has no sections */
  label: string;
  roots: readonly Root[];
}

const SEVERITY_LABELS: Readonly<Record<string, string>> = {
  high: "High",
  medium: "Medium",
  low: "Low"
};

/** Root cause groups everything, screen and severity bucket first then derive roots per bucket */
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
