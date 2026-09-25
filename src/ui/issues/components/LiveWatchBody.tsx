import type { Root, RootDecision } from "../../../shared/grouping/groupingTypes";
import type { GroupBy, RootSection } from "../../../shared/grouping/sectionRoots";
import type { IssueSummary } from "../../../shared/issues/issueTypes";
import type { ActionError } from "../hooks/useIssues";
import { DecisionsView } from "./DecisionsView";
import { FilterBar, type FilterCounts, type StateFilter } from "./FilterBar";
import styles from "./LiveWatchBody.module.css";
import { ToReviewList } from "./ToReviewList";

interface LiveWatchBodyProps {
  actionError: ActionError | null;
  stateFilter: StateFilter;
  onStateFilterChange: (filter: StateFilter) => void;
  counts: FilterCounts;
  filteredSections: readonly RootSection[];
  decisionRoots: readonly Root[];
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  issuesById: ReadonlyMap<string, IssueSummary>;
  decisions: Readonly<Record<string, RootDecision>>;
  canAdjust: boolean;
  selectedInstances: Readonly<Record<string, ReadonlySet<string>>>;
  onToggleInstanceSelected: (signature: string, issueId: string) => void;
  onSelectAllInstances: (root: Root) => void;
  onShowOnCanvas: (root: Root) => void;
  onLocate: (issueId: string) => void;
  onAdjust: (signature: string) => void;
  onIgnore: (signature: string) => void;
  onDefer: (root: Root) => void;
  onToggleImportant: (root: Root) => void;
  onApplyDecisionOffer: (root: Root, decision: RootDecision) => void;
  onRestoreDeferred: (root: Root) => void;
  onReopen: (issueIds: readonly string[], signature: string, clearDecision: boolean) => void;
}

/** The Live Watch tab's body: error, filter bar, and whichever list is active */
export function LiveWatchBody(props: LiveWatchBodyProps) {
  return (
    <>
      {props.actionError && (
        <p role="alert" className={styles.error}>
          {props.actionError.message}
        </p>
      )}
      <FilterBar
        groupBy={props.groupBy}
        onGroupByChange={props.onGroupByChange}
        stateFilter={props.stateFilter}
        onStateFilterChange={props.onStateFilterChange}
        counts={props.counts}
      />
      {props.stateFilter === "ignored" ? (
        <DecisionsView
          roots={props.decisionRoots}
          decisions={props.decisions}
          issuesById={props.issuesById}
          onReopen={props.onReopen}
        />
      ) : (
        <ToReviewList
          sections={props.filteredSections}
          issuesById={props.issuesById}
          decisions={props.decisions}
          ignoredRoots={props.decisionRoots.filter((root) => root.stateBreakdown.ignored)}
          onRestoreIgnored={props.onReopen}
          canAdjust={props.canAdjust}
          selectedInstances={props.selectedInstances}
          onToggleInstanceSelected={props.onToggleInstanceSelected}
          onSelectAllInstances={props.onSelectAllInstances}
          onShowOnCanvas={props.onShowOnCanvas}
          onLocate={props.onLocate}
          onAdjust={props.onAdjust}
          onIgnore={props.onIgnore}
          onDefer={props.onDefer}
          onToggleImportant={props.onToggleImportant}
          onApplyDecisionOffer={props.onApplyDecisionOffer}
          onRestoreDeferred={props.onRestoreDeferred}
        />
      )}
    </>
  );
}
