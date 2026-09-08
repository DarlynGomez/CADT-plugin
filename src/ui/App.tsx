import { CalibrationFlow } from "./calibration/CalibrationFlow";
import { useCalibrationPersistence } from "./hooks/useCalibrationPersistence";
import { ReturningUserScreen } from "./ReturningUserScreen";

export function App() {
  const { loadedProfile, loading, resolvedScope, saveProfile, saveError } =
    useCalibrationPersistence();

  if (loading) {
    return <p>Loading calibration...</p>;
  }

  // Any resolved profile hands off to the returning-user surface, whether it was
  // loaded on open or just saved at the end of calibration. Scope is display-only
  // diagnostic metadata that may not be resolved yet, so it never gates this.
  if (loadedProfile) {
    return <ReturningUserScreen profile={loadedProfile} resolvedScope={resolvedScope} />;
  }

  return <CalibrationFlow onComplete={saveProfile} saveError={saveError} />;
}
