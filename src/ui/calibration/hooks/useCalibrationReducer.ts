import { useReducer } from "react";

import type { CalibrationAnswer } from "../../../shared/calibrationSchema";
import { questions } from "../data/questions";
import type { CalibrationAction, CalibrationState } from "../types";

export function getEnabledQuestions() {
  return questions.filter((question) => question.enabled);
}

function getDefaultAnswers(): Readonly<Record<string, CalibrationAnswer>> {
  const enabledQuestions = getEnabledQuestions();
  return Object.fromEntries(
    enabledQuestions.map((question) => [question.id, question.defaultValue])
  );
}

export const initialCalibrationState: CalibrationState = {
  screen: "welcome",
  questionIndex: 0,
  answers: getDefaultAnswers(),
  loggingConsent: null,
  returnToReview: false,
  direction: "forward"
};

/** Apply one user action to the calibration state */
export function calibrationReducer(
  state: CalibrationState,
  action: CalibrationAction
): CalibrationState {
  switch (action.type) {
    case "START":
      return { ...state, screen: "consent", direction: "forward" };
    case "SKIP":
      return {
        ...state,
        screen: "review",
        answers: getDefaultAnswers(),
        loggingConsent: false,
        returnToReview: false,
        direction: "forward"
      };
    case "SET_CONSENT":
      return { ...state, screen: "question", loggingConsent: action.value, direction: "forward" };
    case "SET_ANSWER":
      return {
        ...state,
        answers: { ...state.answers, [action.question.id]: action.value }
      };
    case "NEXT":
      if (state.screen === "consent") {
        return { ...state, screen: "question", questionIndex: 0, direction: "forward" };
      }

      if (state.screen !== "question") {
        return state;
      }

      if (state.returnToReview) {
        return { ...state, screen: "review", returnToReview: false, direction: "forward" };
      }

      if (state.questionIndex === getEnabledQuestions().length - 1) {
        return { ...state, screen: "review", returnToReview: false, direction: "forward" };
      }

      return { ...state, questionIndex: state.questionIndex + 1, direction: "forward" };
    case "BACK":
      if (state.screen === "consent") {
        return { ...state, screen: "welcome", direction: "backward" };
      }

      if (state.screen === "question" && state.questionIndex > 0) {
        return { ...state, questionIndex: state.questionIndex - 1, direction: "backward" };
      }

      if (state.screen === "question") {
        return { ...state, screen: "consent", direction: "backward" };
      }

      return state;
    case "EDIT":
      return {
        ...state,
        screen: "question",
        questionIndex: action.questionIndex,
        returnToReview: true,
        direction: "backward"
      };
    case "CHANGE_SOMETHING":
      return {
        ...state,
        screen: "question",
        questionIndex: 0,
        returnToReview: false,
        direction: "backward"
      };
    default:
      return state;
  }
}

/** Provide the calibration state machine and its dispatcher */
export function useCalibrationReducer() {
  return useReducer(calibrationReducer, initialCalibrationState);
}
