import type { CalibrationAnswer } from "../../../shared/calibrationSchema";
import { questions } from "../data/questions";
import type { NavigationDirection } from "../types";

import styles from "../components/StepShell.module.css";
import { StepShell } from "../components/StepShell";

interface ReviewStepProps {
  answers: Readonly<Record<string, CalibrationAnswer>>;
  onChangeSomething: () => void;
  onComplete: () => void;
  onEdit: (questionIndex: number) => void;
  direction: NavigationDirection;
  saveError?: string | null;
  submitting?: boolean;
}

export function ReviewStep({
  answers,
  onChangeSomething,
  onComplete,
  onEdit,
  direction,
  saveError,
  submitting = false
}: ReviewStepProps) {
  const enabledQuestions = questions.filter((question) => question.enabled);

  return (
    <StepShell
      heading="Here is your setup."
      totalSteps={enabledQuestions.length}
      progressValue={enabledQuestions.length}
      direction={direction}
    >
      <div className={styles.reviewList}>
        {enabledQuestions.map((question, questionIndex) => {
          const answer = answers[question.id];
          const labels = Array.isArray(answer)
            ? answer.map(
                (value) => question.options.find((option) => option.value === value)?.label
              )
            : [
                question.type === "scale"
                  ? question.options[Number(answer) - 1]?.label
                  : (question.options.find((option) => option.value === answer)?.label ??
                    String(answer))
              ];

          return (
            <div className={styles.reviewItem} key={question.id}>
              <div>
                <h2 className={styles.reviewQuestion}>{question.prompt}</h2>
                <p className={styles.body}>
                  {labels.filter(Boolean).join(", ") || "None selected"}
                </p>
              </div>
              <button
                className={`${styles.button} ${styles.secondaryButton}`}
                type="button"
                aria-label={`Edit ${question.prompt}`}
                onClick={() => onEdit(questionIndex)}
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.secondaryButton}`}
          type="button"
          onClick={onChangeSomething}
        >
          Change something
        </button>
        <button
          className={styles.button}
          type="button"
          onClick={onComplete}
          disabled={submitting}
        >
          {saveError ? "Retry" : "Start designing"}
        </button>
      </div>
      {saveError && <p className={styles.body}>{saveError}</p>}
    </StepShell>
  );
}
