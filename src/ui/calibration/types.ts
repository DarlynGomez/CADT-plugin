import type { CalibrationAnswer, CalibrationProfile } from "../../shared/calibrationSchema";
import type { CalibrationQuestion } from "./data/questions";

export type SingleQuestion = Extract<CalibrationQuestion, { type: "single" }>;
export type MultiQuestion = Extract<CalibrationQuestion, { type: "multi" }>;
export type ScaleQuestion = Extract<CalibrationQuestion, { type: "scale" }>;

export type CalibrationScreen = "welcome" | "consent" | "question" | "review";
export type NavigationDirection = "forward" | "backward";

export interface CalibrationState {
  screen: CalibrationScreen;
  questionIndex: number;
  answers: Readonly<Record<string, CalibrationAnswer>>;
  loggingConsent: boolean | null;
  returnToReview: boolean;
  direction: NavigationDirection;
}

export type CalibrationAction =
  | { type: "START" }
  | { type: "SKIP" }
  | { type: "SET_CONSENT"; value: boolean }
  | { type: "SET_ANSWER"; question: CalibrationQuestion; value: CalibrationAnswer }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "EDIT"; questionIndex: number }
  | { type: "CHANGE_SOMETHING" };

export interface CalibrationFlowProps {
  onComplete?: (profile: CalibrationProfile) => Promise<boolean> | boolean;
  saveError?: string | null;
}
