import { createStoredZip } from "../export/ZipWriter";
import type { MineMotionProject } from "../project/ProjectFile";
import type { AppSettings } from "../settings/AppSettings";
import type { ApplicationLogEntry } from "./ApplicationLog";

export interface SupportBundleOptions {
  project: MineMotionProject;
  settings: AppSettings;
  logs: ApplicationLogEntry[];
  capabilityReport: unknown;
  includeProjectSummary: boolean;
}

export function createSupportBundle(options: SupportBundleOptions): Blob {
  const createdAt = new Date().toISOString();
  const entries = [
    jsonEntry("manifest.json", { schemaVersion: 1, createdAt, appVersion: options.project.metadata.appVersion, privacy: "Local opt-in bundle. No project assets, source paths, secrets, or full project document are included." }),
    jsonEntry("diagnostics/logs.json", options.logs.slice(-1000).map(sanitizeLogEntry)),
    jsonEntry("diagnostics/capabilities.json", sanitizeDiagnosticValue(options.capabilityReport)),
    jsonEntry("diagnostics/settings.json", sanitizeSettings(options.settings))
  ];
  if (options.includeProjectSummary) entries.push(jsonEntry("diagnostics/project-summary.json", summarizeProject(options.project)));
  return createStoredZip(entries);
}


function sanitizeLogEntry(entry: ApplicationLogEntry): ApplicationLogEntry {
  return {
    ...entry,
    message: redactSupportText(entry.message),
    details: entry.details ? Object.fromEntries(Object.entries(entry.details).map(([key, value]) => [key.slice(0, 80), typeof value === "string" ? redactSupportText(value) : value])) : undefined
  };
}
function redactSupportText(value: string): string {
  return value
    .replace(/(?:[A-Za-z]:\\|\/home\/|\/Users\/)[^\s"']+/g, "[local-path]")
    .replace(/((?:token|api[_-]?key|secret)\s*[:=]\s*)[^\s,;]+/gi, "$1[redacted]")
    .slice(0, 4000);
}

function sanitizeDiagnosticValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[depth-limit]";
  if (typeof value === "string") return redactSupportText(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 500).map((entry) => sanitizeDiagnosticValue(entry, depth + 1));
  if (!value || typeof value !== "object") return String(value).slice(0, 500);
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 500).map(([key, entry]) => [
    key.slice(0, 100),
    /token|api[_-]?key|secret/i.test(key) ? "[redacted]" : sanitizeDiagnosticValue(entry, depth + 1)
  ]));
}

function summarizeProject(project: MineMotionProject): Record<string, unknown> {
  return {
    schemaVersion: project.schemaVersion,
    projectNameLength: project.projectName.length,
    fps: project.animation.fps,
    durationFrames: project.animation.durationFrames,
    counts: {
      characters: project.scene.characters.length,
      cameras: project.scene.cameras.length,
      objects: project.scene.importedObjects.length,
      effects: project.effects.instances.length,
      audio: project.audio.clips.length,
      shots: project.production.shots.length,
      renderJobs: project.renderQueue.jobs.length,
      importedChunks: project.world?.importedChunks?.length ?? 0
    },
    world: project.world ? { cached: Boolean(project.world.cachedMesh?.embedded), sourceAvailable: !project.world.sourcePathMissing } : null,
    updatedAt: project.metadata.updatedAt
  };
}
function sanitizeSettings(settings: AppSettings): Record<string, unknown> {
  return {
    schemaVersion: settings.schemaVersion,
    general: { language: settings.general.language, autosaveEnabled: settings.general.autosaveEnabled, autosaveIntervalSeconds: settings.general.autosaveIntervalSeconds, defaultFps: settings.general.defaultFps },
    viewport: { ...settings.viewport },
    editor: { ...settings.editor },
    plugins: { pluginsEnabled: settings.plugins.pluginsEnabled, allowExperimentalPlugins: settings.plugins.allowExperimentalPlugins, safeMode: settings.plugins.safeMode, disabledPluginCount: settings.plugins.disabledPluginIds.length }
  };
}
function jsonEntry(path: string, value: unknown) { return { filename: path, data: new TextEncoder().encode(JSON.stringify(value, null, 2)) }; }
