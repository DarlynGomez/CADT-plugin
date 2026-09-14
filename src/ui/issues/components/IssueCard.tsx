import { useState, type CSSProperties } from "react";

import type { IssueSummary } from "../../../shared/issues/issueTypes";
import { computeFade } from "../fade";
import { AcknowledgeForm } from "./AcknowledgeForm";
import { IssueActions } from "./IssueActions";
import styles from "./IssueCard.module.css";
import { SeverityLabel } from "./SeverityLabel";

const RULE_TEXT: Record<string, string> = { contrast: "Contrast" };

interface ContrastEvidence {
  measuredRatio: number;
  requiredRatio: number;
}

// TODO(darlyn/CADT-###): once a second rule exists, replace this direct render with a
// renderer registry keyed by ruleId, so each rule owns its own evidence display. See
// ADR-016: evidence stays generic on the shared type on purpose; only the display is
// still contrast-specific, and only because there is exactly one rule today.
function describeEvidence(ruleId: string, evidence: unknown): string | null {
  if (ruleId !== "contrast" || !evidence || typeof evidence !== "object") {
    return null;
  }
  const { measuredRatio, requiredRatio } = evidence as ContrastEvidence;
  if (typeof measuredRatio !== "number" || typeof requiredRatio !== "number") {
    return null;
  }
  return `${measuredRatio.toFixed(2)}:1 measured, ${requiredRatio.toFixed(1)}:1 required`;
}

interface IssueCardProps {
  issue: IssueSummary;
  onDefer: (issueId: string) => void;
  onFlagImportant: (issueId: string) => void;
  onReopen: (issueId: string) => void;
  onAcknowledge: (issueId: string, reason: string) => void;
  onFocus: (issueId: string) => void;
}

export function IssueCard({
  issue,
  onDefer,
  onFlagImportant,
  onReopen,
  onAcknowledge,
  onFocus
}: IssueCardProps) {
  const [acknowledging, setAcknowledging] = useState(false);
  const fade = computeFade(
    issue.severityAtLastDetection,
    issue.encounterCount,
    issue.state === "important"
  );

  // The pure fade function drives these two custom properties; the stylesheet never
  // hardcodes an opacity or warning-mix literal. Both apply only to decorative layers
  // (background and accent), never to the text itself, so fading cannot take text
  // below its own contrast floor. See DESIGN_SYSTEM.md section 8.
  const fadeStyle = {
    "--issue-opacity": fade.opacity,
    "--issue-warning-mix": fade.warningMix
  } as CSSProperties;

  const evidenceText = describeEvidence(issue.ruleId, issue.evidence);

  return (
    <li className={styles.card} style={fadeStyle}>
      <div className={styles.header}>
        <h3 className={styles.title}>{issue.nodeName}</h3>
        <SeverityLabel severity={issue.severityAtLastDetection} />
      </div>
      <p className={styles.meta}>{RULE_TEXT[issue.ruleId] ?? issue.ruleId}</p>
      {evidenceText && <p className={styles.meta}>{evidenceText}</p>}
      {acknowledging ? (
        <AcknowledgeForm
          onSubmit={(reason) => {
            onAcknowledge(issue.id, reason);
            setAcknowledging(false);
          }}
          onCancel={() => setAcknowledging(false)}
        />
      ) : (
        <IssueActions
          state={issue.state}
          onDefer={() => onDefer(issue.id)}
          onFlagImportant={() => onFlagImportant(issue.id)}
          onAcknowledgeClick={() => setAcknowledging(true)}
          onReopen={() => onReopen(issue.id)}
          onFocus={() => onFocus(issue.id)}
        />
      )}
    </li>
  );
}
