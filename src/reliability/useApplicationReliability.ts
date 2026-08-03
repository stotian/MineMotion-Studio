import { useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { getRuntimeCapabilityRegistry } from "../core/capabilities/CapabilityRegistry";
import { applicationLog } from "../diagnostics/ApplicationLog";
import { createSupportBundle } from "../diagnostics/SupportBundle";
import { downloadBrowserBlob } from "../export/BrowserDownload";
import type { MineMotionProject } from "../project/ProjectFile";
import { DEFAULT_APP_SETTINGS } from "../settings/DefaultSettings";
import { SettingsStore, type AppSettings } from "../settings/AppSettings";

export function useApplicationReliability(options: {
  settings: AppSettings;
  project: MineMotionProject;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  setStatus: (message: string) => void;
}) {
  const { settings, project, setSettings, setStatus } = options;

  useEffect(() => {
    SettingsStore.save(settings);
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--ui-scale", String(settings.editor.uiScale));
    root.style.setProperty("--text-scale", String(settings.editor.textScale));
    root.dataset.theme = settings.editor.theme;
    root.dataset.contrast = settings.editor.highContrast ? "high" : "normal";
    root.dataset.motion = settings.editor.reducedMotion ? "reduced" : "full";
    root.dataset.colorVision = settings.editor.colorVisionMode;
  }, [settings]);

  const exportSupportBundle = useCallback((includeProjectSummary: boolean) => {
    const capabilities = getRuntimeCapabilityRegistry();
    const blob = createSupportBundle({
      project,
      settings,
      logs: applicationLog.list(),
      capabilityReport: {
        capabilities: capabilities.list(),
        codecs: capabilities.supportedCodecs(),
        renderer: capabilities.rendererBackendPlan()
      },
      includeProjectSummary
    });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadBrowserBlob(blob, `minemotion-support-${stamp}.zip`);
    applicationLog.write("application", "info", "A local support bundle was exported.");
    setStatus("Support bundle exported locally.");
  }, [project, settings, setStatus]);

  const resetSettings = useCallback(() => {
    setSettings(structuredClone(DEFAULT_APP_SETTINGS));
    applicationLog.write("application", "info", "Application settings and layout preferences were reset.");
    setStatus("Application settings reset to defaults.");
  }, [setSettings, setStatus]);

  return { exportSupportBundle, resetSettings };
}
