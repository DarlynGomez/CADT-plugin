import type { CalibrationProfile } from "../shared/calibrationSchema";

interface ReturningUserScreenProps {
  profile: CalibrationProfile;
  resolvedScope: "file" | "user" | null;
}

export function ReturningUserScreen({ profile, resolvedScope }: ReturningUserScreenProps) {
  // TODO(darlyn/CADT-001): Replace this temporary screen with the real plugin surface
  return (
    <main>
      <h1>Temporary returning-user screen</h1>
      <p>Calibration was found</p>
      <p>Resolved storage scope: {resolvedScope ?? "not yet resolved"}</p>
      <h2>Resolved answers</h2>
      <pre>{JSON.stringify(profile.answers, null, 2)}</pre>
    </main>
  );
}
