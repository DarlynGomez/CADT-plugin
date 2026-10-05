import { Check, Info } from "lucide-react";

import type { AdjustVariableScope } from "../../../../shared/adjustMessageTypes";
import type { AdjustScope } from "../useAdjustSession";
import type { VariableConsequenceData } from "../useAdjustVariableScope";
import styles from "./ScopeSection.module.css";

interface ScopeSectionProps {
  scope: AdjustScope;
  onScopeChange: (scope: AdjustScope) => void;
  scopeCount: number;
  totalInstances: number;
  variableScope: AdjustVariableScope | null;
  variableConsequence: VariableConsequenceData | null;
}

function instancesLabel(scopeCount: number): string {
  return scopeCount > 1 ? `Change ${scopeCount} layers` : "Change only the current instance";
}

function instancesDetail(scopeCount: number, remaining: number): string {
  const layerWord = scopeCount === 1 ? "layer" : "layers";
  const suffix = remaining > 0 ? ` ${remaining} more in this group left unchanged.` : "";
  return `Changes ${scopeCount} ${layerWord}.${suffix}`;
}

function variableDetail(consequence: VariableConsequenceData | null): string {
  if (!consequence) {
    return "Calculating how many layers this would change...";
  }
  const layerWord = consequence.totalConsumers === 1 ? "layer" : "layers";
  const failingClause =
    consequence.newlyFailingCount > 0 ? ` ${consequence.newlyFailingCount} would newly fail.` : "";
  return `Updates ${consequence.totalConsumers} ${layerWord}.${failingClause}`;
}

/**
 * GROUPING_SPEC.md section 8's instances scope, always available, and section 9's
 * variable scope, offered whenever the foreground is bound to a local variable and
 * disabled with its own explanation for a library one. Both are real, selectable
 * options; the count on the variable row is computed fresh for whatever colour is
 * currently active, never assumed. See ADR-033.
 */
export function ScopeSection({
  scope,
  onScopeChange,
  scopeCount,
  totalInstances,
  variableScope,
  variableConsequence
}: ScopeSectionProps) {
  const remaining = totalInstances - scopeCount;
  const variableDisabled = !variableScope || variableScope.remote;

  return (
    <div className={styles.section}>
      <p className={styles.heading}>2. Choose adjustment scope</p>
      <button
        type="button"
        className={styles.option}
        data-checked={scope === "instances"}
        onClick={() => onScopeChange("instances")}
      >
        <span className={styles.radio} data-checked={scope === "instances"} aria-hidden="true" />
        <span className={styles.optionBody}>
          <span className={styles.optionLabelRow}>
            <span className={styles.optionLabel}>{instancesLabel(scopeCount)}</span>
            <span
              className={styles.infoIcon}
              title="Every layer checked in Related grouped issues, or just this one if none are checked"
            >
              <Info size={14} aria-hidden="true" />
            </span>
          </span>
          <span className={styles.optionDetail}>{instancesDetail(scopeCount, remaining)}</span>
        </span>
        {scope === "instances" && <Check className={styles.check} size={18} aria-hidden="true" />}
      </button>
      {variableScope && (
        <button
          type="button"
          className={styles.option}
          data-checked={scope === "variable"}
          disabled={variableDisabled}
          onClick={() => onScopeChange("variable")}
        >
          <span className={styles.radio} data-checked={scope === "variable"} aria-hidden="true" />
          <span className={styles.optionBody}>
            <span className={styles.optionLabelRow}>
              <span className={styles.optionLabel}>
                Update variable &ldquo;{variableScope.name}&rdquo;
              </span>
              <span
                className={styles.infoIcon}
                title={`Writes ${variableScope.collectionName} / ${variableScope.modeName}. Every layer bound to this variable changes, including layers that currently pass.`}
              >
                <Info size={14} aria-hidden="true" />
              </span>
            </span>
            <span className={styles.optionDetail}>
              {variableScope.remote
                ? "Library colour. Edit it in its source file."
                : variableDetail(variableConsequence)}
            </span>
          </span>
          {scope === "variable" && <Check className={styles.check} size={18} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
