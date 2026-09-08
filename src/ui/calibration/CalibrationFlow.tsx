import { useEffect, useRef, useState } from "react";

import type { CalibrationProfile } from "../../shared/calibrationSchema";
import { MultiChoiceStep } from "./steps/MultiChoiceStep";
import { ConsentStep } from "./steps/ConsentStep";
import { ReviewStep } from "./steps/ReviewStep";
import { ScaleStep } from "./steps/ScaleStep";
import { SingleChoiceStep } from "./steps/SingleChoiceStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import { questions } from "./data/questions";
import { getEnabledQuestions, useCalibrationReducer } from "./hooks/useCalibrationReducer";
import type { CalibrationFlowProps } from "./types";

export function CalibrationFlow({ onComplete, saveError }: CalibrationFlowProps) {
  const [state, dispatch] = useCalibrationReducer();
  const enabledQuestions = getEnabledQuestions();
  const initialOpenRef = useRef(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initialOpenRef.current = false;
  }, []);

  async function complete() {
    if (submitting || state.loggingConsent === null) {
      return;
    }

    setSubmitting(true);
    const profile: CalibrationProfile = {
      schemaVersion: 1,
      completedAt: new Date().toISOString(),
      loggingConsent: state.loggingConsent,
      answers: state.answers
    };

    const saved = onComplete ? await onComplete(profile) : true;
    if (saved === false) {
      // The save failed. Unlock so the Review screen can offer a retry. On
      // success the app swaps in the returning-user surface and unmounts this
      // flow, so there is nothing left to do here.
      setSubmitting(false);
    }
  }

  if (state.screen === "welcome") {
    return (
      <WelcomeStep
        totalSteps={enabledQuestions.length}
        direction={state.direction}
        initialOpen={initialOpenRef.current}
        onSkip={() => dispatch({ type: "SKIP" })}
        onStart={() => dispatch({ type: "START" })}
      />
    );
  }

  if (state.screen === "consent") {
    return (
      <ConsentStep
        totalSteps={enabledQuestions.length}
        direction={state.direction}
        onBack={() => dispatch({ type: "BACK" })}
        onConsent={(value) => dispatch({ type: "SET_CONSENT", value })}
      />
    );
  }

  if (state.screen === "review") {
    return (
      <ReviewStep
        answers={state.answers}
        onChangeSomething={() => dispatch({ type: "CHANGE_SOMETHING" })}
        onComplete={complete}
        onEdit={(questionIndex) => dispatch({ type: "EDIT", questionIndex })}
        direction={state.direction}
        saveError={saveError}
        submitting={submitting}
      />
    );
  }

  const question = enabledQuestions[state.questionIndex];
  const step = state.questionIndex + 1;
  const onBack = () => dispatch({ type: "BACK" });
  const onContinue = () => dispatch({ type: "NEXT" });

  if (!question) {
    return null;
  }

  switch (question.type) {
    case "single":
      return (
        <SingleChoiceStep
          question={question}
          step={step}
          totalSteps={enabledQuestions.length}
          direction={state.direction}
          value={state.answers[question.id] as string | undefined}
          onBack={onBack}
          onChange={(value) => dispatch({ type: "SET_ANSWER", question, value })}
          onContinue={onContinue}
        />
      );
    case "multi":
      return (
        <MultiChoiceStep
          question={question}
          step={step}
          totalSteps={enabledQuestions.length}
          direction={state.direction}
          value={state.answers[question.id] as readonly string[] | undefined}
          onBack={onBack}
          onChange={(value) => dispatch({ type: "SET_ANSWER", question, value })}
          onContinue={onContinue}
        />
      );
    case "scale":
      return (
        <ScaleStep
          question={question}
          step={step}
          totalSteps={enabledQuestions.length}
          direction={state.direction}
          value={state.answers[question.id] as number | undefined}
          onBack={onBack}
          onChange={(value) => dispatch({ type: "SET_ANSWER", question, value })}
          onContinue={onContinue}
        />
      );
    default:
      return null;
  }
}

/** Count the questions included in the rendered flow */
export function getEnabledQuestionCount() {
  return questions.filter((question) => question.enabled).length;
}
