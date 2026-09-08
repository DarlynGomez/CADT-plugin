import { useCallback, useEffect, useState } from "react";

import { isCalibrationProfile, type CalibrationProfile } from "../../shared/calibrationSchema";
import type { PluginToUiMessage, UiToPluginMessage } from "../../shared/messageTypes";

function isPluginToUiMessage(value: unknown): value is PluginToUiMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;
  if (message.type === "CALIBRATION_LOADED") {
    return (
      (message.resolvedScope === "file" ||
        message.resolvedScope === "user" ||
        message.resolvedScope === null) &&
      (message.profile === null || isCalibrationProfile(message.profile))
    );
  }
  return (
    message.type === "CALIBRATION_SAVED" ||
    (message.type === "CALIBRATION_SAVE_FAILED" && typeof message.message === "string")
  );
}

function sendMessage(message: UiToPluginMessage) {
  window.parent.postMessage({ pluginMessage: message }, "*");
}

/** Load and save calibration profiles through the Figma sandbox boundary */
export function useCalibrationPersistence() {
  const [loadedProfile, setLoadedProfile] = useState<CalibrationProfile | null>(null);
  const [resolvedScope, setResolvedScope] = useState<"file" | "user" | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = event.data?.pluginMessage;
      if (!isPluginToUiMessage(message)) {
        return;
      }

      if (message.type === "CALIBRATION_LOADED") {
        setLoadedProfile(message.profile);
        setResolvedScope(message.resolvedScope);
        setLoading(false);
      }
    }

    window.addEventListener("message", handleMessage);
    sendMessage({ type: "CALIBRATION_LOAD" });
    const timeout = window.setTimeout(() => setLoading(false), 3000);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const saveProfile = useCallback((profile: CalibrationProfile) => {
    return new Promise<boolean>((resolve) => {
      let timeout = 0;

      function settle(outcome: boolean, error: string | null) {
        window.clearTimeout(timeout);
        window.removeEventListener("message", handleMessage);
        setSaveError(error);
        if (outcome) {
          // Hand off to the returning-user surface right away using the profile
          // we just persisted. The sandbox also re-resolves and sends
          // CALIBRATION_LOADED, which fills in the resolved scope afterwards.
          setLoadedProfile(profile);
        }
        resolve(outcome);
      }

      function handleMessage(event: MessageEvent) {
        const message = event.data?.pluginMessage;
        if (!isPluginToUiMessage(message)) {
          return;
        }
        if (message.type === "CALIBRATION_SAVED") {
          settle(true, null);
        } else if (message.type === "CALIBRATION_SAVE_FAILED") {
          settle(false, message.message);
        }
      }

      window.addEventListener("message", handleMessage);
      // Never leave the Review screen locked if the sandbox goes silent. Offer a
      // plain retry instead, per the storage write-failure rule.
      timeout = window.setTimeout(
        () => settle(false, "The setup could not be saved. Check your connection and retry."),
        5000
      );
      sendMessage({ type: "CALIBRATION_SAVE", profile });
    });
  }, []);

  return { loadedProfile, loading, resolvedScope, saveProfile, saveError };
}
