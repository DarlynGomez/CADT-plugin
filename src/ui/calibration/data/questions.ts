interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

interface BaseQuestion {
  id: string;
  enabled: boolean;
  prompt: string;
  helperText?: string;
  optional: boolean;
}

interface SingleQuestion extends BaseQuestion {
  type: "single";
  options: readonly QuestionOption[];
  defaultValue: string;
}

interface MultiQuestion extends BaseQuestion {
  type: "multi";
  options: readonly QuestionOption[];
  defaultValue: readonly string[];
}

interface ScaleQuestion extends BaseQuestion {
  type: "scale";
  options: readonly QuestionOption[];
  defaultValue: number;
}

/** A typed definition for one data-driven calibration question */
export type CalibrationQuestion = SingleQuestion | MultiQuestion | ScaleQuestion;

/** The authoring content for the separate logging consent gate */
export interface ConsentScreen {
  heading: string;
  body: string;
  detailsLabel: string;
  details: string;
  allowLabel: string;
  declineLabel: string;
}

// Consent stays outside questions so skipping can never manufacture research consent
export const consentScreen: ConsentScreen = {
  heading: "Can we log how you use CADT?",
  body: "CADT is part of a research study at RIT. Logging records which issues you defer, fix, or acknowledge. It does not record your design content. You can use CADT fully with logging turned off.",
  detailsLabel: "What gets logged",
  details:
    "CADT records when you defer, fix, or acknowledge an issue. It does not record your design content.",
  allowLabel: "Allow logging",
  declineLabel: "Continue without logging"
};

/** The ordered authored questions; disabled entries are filtered by the flow at runtime */
export const questions: readonly CalibrationQuestion[] = [
  {
    id: "projectType",
    type: "single",
    enabled: true,
    prompt: "What are you designing?",
    options: [
      { value: "mobile-app", label: "Mobile app" },
      { value: "web-page", label: "Web page" },
      { value: "game", label: "Game" },
      { value: "something-else", label: "Something else" }
    ],
    defaultValue: "mobile-app",
    optional: false
  },
  {
    id: "primaryAudience",
    type: "single",
    enabled: true,
    prompt: "Who is this mainly for?",
    options: [
      { value: "general-public", label: "General public" },
      { value: "under-pressure", label: "People in a hurry or under pressure" },
      { value: "older-adults", label: "Older adults" },
      { value: "children", label: "Children" },
      { value: "specialized-group", label: "A specialized group" }
    ],
    defaultValue: "general-public",
    optional: false
  },
  {
    id: "useEnvironments",
    type: "multi",
    enabled: true,
    prompt: "Where will people be using this?",
    options: [
      { value: "bright-sunlight", label: "Bright sunlight or outdoors" },
      { value: "low-light", label: "Low light or night" },
      { value: "low-battery", label: "Low battery" },
      { value: "one-handed", label: "One handed or on the move" },
      { value: "no-sound", label: "Somewhere they cannot rely on sound" }
    ],
    defaultValue: [],
    optional: true
  },
  {
    id: "communityFocus",
    type: "multi",
    // Disabled pending explicit advisor sign-off; enable when the advisor approves this values question
    enabled: false,
    prompt: "Any communities you want extra focus on?",
    helperText:
      "Baseline checks run for everyone no matter what you pick here. This only adds depth, it never removes coverage.",
    options: [
      { value: "blind-low-vision", label: "Blind or low vision" },
      { value: "deaf-hard-of-hearing", label: "Deaf or hard of hearing" },
      { value: "motor-mobility", label: "Motor or mobility" },
      { value: "cognitive-learning", label: "Cognitive or learning differences" },
      { value: "neurodivergent", label: "Neurodivergent" },
      { value: "chronic-illness-fatigue", label: "Chronic illness or fatigue" },
      { value: "no-specific-focus", label: "No specific focus" }
    ],
    defaultValue: ["no-specific-focus"],
    optional: true
  },
  {
    id: "otherTools",
    type: "single",
    enabled: true,
    prompt: "Using any of these alongside CADT?",
    options: [
      { value: "stark", label: "Stark" },
      { value: "figma-checker", label: "Figma's built in checker" },
      { value: "evinced", label: "Evinced" },
      { value: "another-plugin", label: "Another plugin" },
      { value: "none", label: "None" }
    ],
    defaultValue: "none",
    optional: false
  },
  {
    id: "accessibilityFamiliarity",
    type: "single",
    enabled: true,
    prompt: "How familiar are you with accessibility work?",
    options: [
      { value: "new-to-it", label: "New to it" },
      { value: "some-experience", label: "Some experience" },
      { value: "very-experienced", label: "Very experienced" },
      { value: "professional", label: "I do this professionally" }
    ],
    defaultValue: "new-to-it",
    optional: false
  },
  {
    id: "explanationPreference",
    type: "single",
    enabled: true,
    prompt: "When you hit a new rule, what do you want first?",
    options: [
      { value: "explain-first", label: "Explain why it matters first" },
      { value: "fix-first", label: "Show me the fix now, details available later" }
    ],
    defaultValue: "explain-first",
    optional: false
  },
  {
    id: "aiAssistanceLevel",
    type: "scale",
    enabled: true,
    prompt: "How much should CADT do on its own?",
    helperText: "Accountability tracking keeps running at every setting.",
    options: [
      { value: "flag", label: "Just flag issues" },
      { value: "explain", label: "Flag and explain" },
      { value: "suggest", label: "Explain and suggest fixes" },
      { value: "apply", label: "Suggest and apply automatically" }
    ],
    defaultValue: 1,
    optional: false
  },
  {
    id: "teamReview",
    type: "single",
    // Disabled pending advisor confirmation that team review belongs in the calibration flow
    enabled: false,
    prompt: "Will other people review or edit this file?",
    options: [
      { value: "just-me", label: "Just me" },
      { value: "design-team", label: "A design team" },
      { value: "team-stakeholders", label: "Team plus stakeholders" }
    ],
    defaultValue: "just-me",
    optional: false
  }
];
