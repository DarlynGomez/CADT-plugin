import { CalibrationFlow } from "./calibration/CalibrationFlow";
import { useCalibrationPersistence } from "./hooks/useCalibrationPersistence";
import { IssuePanel } from "./issues/IssuePanel";

/** The raw 1 to 4 answer to "How much should CADT do on its own?", or null if unanswered */
function readAiAssistanceLevel(profile: ReturnType<typeof useCalibrationPersistence>["loadedProfile"]) {
  const value = profile?.answers.aiAssistanceLevel;
  return typeof value === "number" ? value : null;
}

export function App() {
  const { loadedProfile, loading, saveProfile, saveError } = useCalibrationPersistence();

  if (loading) {
    return <p>Loading calibration...</p>;
  }

  // A resolved profile, whether loaded on open or just saved at the end of
  // calibration, hands off to the real plugin surface: the accountability panel.
  if (loadedProfile) {
    return <IssuePanel aiAssistanceLevel={readAiAssistanceLevel(loadedProfile)} />;
  }

  return <CalibrationFlow onComplete={saveProfile} saveError={saveError} />;
}
