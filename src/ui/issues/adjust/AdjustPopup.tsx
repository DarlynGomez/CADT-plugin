import type { Root } from "../../../shared/grouping/groupingTypes";
import { keepHue } from "../../../shared/colour/keepHue";
import { parseHex } from "../../../shared/colour/hexInput";
import { paletteMatch } from "../../../shared/colour/paletteMatch";
import {
  backgroundSourceName,
  readContrastEvidence
} from "../../../shared/issues/contrastEvidenceView";
import type { IssueSummary } from "../../../shared/issues/issueTypes";
import styles from "./AdjustPopup.module.css";
import { AdjustActions } from "./components/AdjustActions";
import { AdjustBody } from "./components/AdjustBody";
import { AdjustHeader } from "./components/AdjustHeader";
import { BindingNotice } from "./components/BindingNotice";
import { ScopeSection } from "./components/ScopeSection";
import { useAdjustMessages } from "./useAdjustMessages";
import { useAdjustSession } from "./useAdjustSession";

interface AdjustPopupProps {
  root: Root;
  representativeIssue: IssueSummary;
  /** Instances checked in this root's "Related grouped issues" list, if any */
  selectedInstanceIds: ReadonlySet<string>;
  /** The raw 1 to 4 calibration answer for "How much should CADT do on its own?" */
  aiAssistanceLevel: number;
  onClose: () => void;
}

/**
 * Three option cards, the third expanding into the wheel inline when chosen, or the
 * wheel alone at the "Flag and explain" calibration level. Scope is GROUPING_SPEC.md
 * section 8: whatever the designer checked in the instance list, or just the
 * representative when nothing is checked; preview and apply always target exactly that
 * set, never more. Gating on aiAssistanceLevel happens in the caller.
 */
export function AdjustPopup({
  root,
  representativeIssue: issue,
  selectedInstanceIds,
  aiAssistanceLevel,
  onClose
}: AdjustPopupProps) {
  const evidence = readContrastEvidence(issue.ruleId, issue.evidence);
  const background = evidence ? parseHex(evidence.backgroundHex) : null;
  const current = evidence ? parseHex(evidence.foregroundHex) : null;
  const optionA =
    evidence && background && current ? keepHue(current, background, evidence.requiredRatio) : null;

  const scopeIds =
    selectedInstanceIds.size > 0 ? [...selectedInstanceIds] : [root.representativeIssueId];

  const { options, applied, preview, clearPreview, apply, abandon } = useAdjustMessages(issue.id);
  const session = useAdjustSession({
    aiAssistanceLevel,
    optionA,
    scopeIds,
    applied,
    preview,
    clearPreview,
    apply,
    abandon,
    onClose
  });

  if (!evidence || !background || !current || !optionA) {
    return (
      <div className={styles.popup}>
        <AdjustHeader title="Adjust contrast" subtitle={issue.nodeName} onClose={onClose} />
        <p className={styles.diagnostic}>
          This issue&rsquo;s contrast evidence could not be read, so there is nothing to adjust
          here. Close this and reopen it; if it keeps happening, the finding itself is stale and a
          rescan should clear it.
        </p>
      </div>
    );
  }

  const optionB = options
    ? paletteMatch(current, options.palette, background, evidence.requiredRatio)
    : null;

  return (
    <div className={styles.popup} onKeyDown={session.handleKeyDown}>
      <AdjustHeader title="Adjust contrast" subtitle={issue.nodeName} onClose={onClose} />
      {options?.binding && <BindingNotice binding={options.binding} />}
      <AdjustBody
        aiAssistanceLevel={aiAssistanceLevel}
        sampleText={issue.nodeName}
        background={background}
        backgroundAncestorName={backgroundSourceName(evidence)}
        requiredRatio={evidence.requiredRatio}
        optionA={optionA}
        optionB={optionB}
        wheelColor={session.wheelColor}
        focused={session.focused}
        onFocusOption={session.focusOption}
        onOpenWheel={session.openWheel}
        onColorChange={session.selectWheelColor}
        onHexRejected={session.onHexRejected}
      />
      {(root.instances.length > 1 || options?.binding) && (
        <ScopeSection
          scopeCount={scopeIds.length}
          totalInstances={root.instances.length}
          binding={options?.binding ?? null}
        />
      )}

      <AdjustActions
        canApply={Boolean(session.activeColor)}
        onCancel={session.handleCancel}
        onApply={session.handleApply}
      />
    </div>
  );
}
