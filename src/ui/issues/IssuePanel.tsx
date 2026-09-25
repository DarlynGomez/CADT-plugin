import { useState } from "react";

import type { Root, RootDecision } from "../../shared/grouping/groupingTypes";
import type { GroupBy } from "../../shared/grouping/sectionRoots";
import { Header, type MainTab } from "./components/Header";
import type { StateFilter } from "./components/FilterBar";
import { LiveWatchBody } from "./components/LiveWatchBody";
import { RootSheetHost } from "./components/RootSheetHost";
import { TeachMeWhyPlaceholder } from "./components/TeachMeWhyPlaceholder";
import { useEscapePrecedence } from "./hooks/useEscapePrecedence";
import { useInstanceSelection } from "./hooks/useInstanceSelection";
import { useIssues } from "./hooks/useIssues";
import { useRoots } from "./hooks/useRoots";
import { useRootSheet } from "./hooks/useRootSheet";
import { useSelectionBanner } from "./hooks/useSelectionBanner";
import styles from "./IssuePanel.module.css";

function instanceIds(root: Root): string[] {
  return root.instances.map((instance) => instance.issueId);
}

interface IssuePanelProps {
  /** The raw 1 to 4 "How much should CADT do on its own?" answer, or null when no
   *  calibration profile is loaded, which gates the Adjust control on each card */
  aiAssistanceLevel: number | null;
}

/**
 * GROUPING_SPEC.md 6: the redesigned panel. Owns filter and grouping choice and
 * delegates per-root selection, sheet, and selection-banner state to their own hooks;
 * every root card is otherwise a pure function of its own root and the callbacks this
 * hands it.
 */
export function IssuePanel({ aiAssistanceLevel }: IssuePanelProps) {
  const {
    issues,
    decisions,
    loading,
    actionError,
    focusIssue,
    deferRoot,
    markRootImportant,
    unmarkRootImportant,
    ignoreRoot,
    reopenRoot,
    showOnCanvas,
    restoreSelection
  } = useIssues();

  const [mainTab, setMainTab] = useState<MainTab>("live-watch");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("root-cause");
  const { selectedInstances, toggleInstanceSelected, selectAllInstances } = useInstanceSelection();
  const { sheet, openAdjust, openIgnore, closeSheet } = useRootSheet();
  const {
    showingCount,
    show: showRootOnCanvas,
    restore: restoreShownSelection
  } = useSelectionBanner(showOnCanvas, restoreSelection);

  const { headline, counts, reviewRoots, filteredSections, decisionRoots, issuesById } = useRoots(
    issues,
    decisions,
    groupBy,
    stateFilter
  );
  const canAdjust = (aiAssistanceLevel ?? 1) >= 2;

  useEscapePrecedence(sheet, closeSheet, showingCount, restoreShownSelection);

  function handleToggleImportant(root: Root) {
    if (root.displayState === "important") {
      unmarkRootImportant(instanceIds(root));
    } else {
      markRootImportant(instanceIds(root));
    }
  }

  function handleApplyDecisionOffer(root: Root, decision: RootDecision) {
    ignoreRoot(instanceIds(root), decision.reason, root.signature, true);
  }

  function handleRecordIgnore(root: Root, reason: string) {
    ignoreRoot(instanceIds(root), reason, root.signature, false);
    closeSheet();
  }

  if (loading) {
    return <p className={styles.status}>Loading issues...</p>;
  }

  return (
    <main className={styles.panel} aria-label="Accessibility issues">
      <Header headline={headline} activeMainTab={mainTab} onMainTabChange={setMainTab} />
      {mainTab === "teach-me-why" ? (
        <TeachMeWhyPlaceholder />
      ) : (
        <LiveWatchBody
          showingCount={showingCount}
          onRestoreSelection={restoreShownSelection}
          actionError={actionError}
          stateFilter={stateFilter}
          onStateFilterChange={setStateFilter}
          counts={counts}
          filteredSections={filteredSections}
          decisionRoots={decisionRoots}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          issuesById={issuesById}
          decisions={decisions}
          canAdjust={canAdjust}
          selectedInstances={selectedInstances}
          onToggleInstanceSelected={toggleInstanceSelected}
          onSelectAllInstances={selectAllInstances}
          onShowOnCanvas={showRootOnCanvas}
          onLocate={focusIssue}
          onAdjust={openAdjust}
          onIgnore={openIgnore}
          onDefer={(root) => deferRoot(instanceIds(root))}
          onToggleImportant={handleToggleImportant}
          onApplyDecisionOffer={handleApplyDecisionOffer}
          onReopen={reopenRoot}
        />
      )}
      <RootSheetHost
        sheet={sheet}
        roots={reviewRoots}
        issuesById={issuesById}
        aiAssistanceLevel={aiAssistanceLevel}
        onCloseAdjust={closeSheet}
        onCancelIgnore={closeSheet}
        onRecordIgnore={handleRecordIgnore}
      />
    </main>
  );
}
