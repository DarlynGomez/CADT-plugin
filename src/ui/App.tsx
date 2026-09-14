import { CalibrationFlow } from "./calibration/CalibrationFlow";
import { useCalibrationPersistence } from "./hooks/useCalibrationPersistence";
import { IssuePanel } from "./issues/IssuePanel";

export function App() {
  const { loadedProfile, loading, saveProfile, saveError } = useCalibrationPersistence();

  if (loading) {
    return <p>Loading calibration...</p>;
  }

  // A resolved profile, whether loaded on open or just saved at the end of
  // calibration, hands off to the real plugin surface: the accountability panel.
  if (loadedProfile) {
    return <IssuePanel />;
  }

  return <CalibrationFlow onComplete={saveProfile} saveError={saveError} />;
}
