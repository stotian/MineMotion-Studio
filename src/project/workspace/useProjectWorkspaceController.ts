import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction
} from "react";
import { downloadBrowserBlob } from "../../export/BrowserDownload";
import { openNativeProjectFile, saveNativeFile } from "../../desktop/NativeFileWorkflow";
import { isTauriRuntimeAvailable } from "../../core/capabilities/CapabilityRegistry";
import { HistoryStack } from "../../history/HistoryStack";
import type { LocalizationDiagnosticCode } from "../../localization/LocalizationDiagnostics";
import type {
  TranslationKey,
  TranslationValues
} from "../../localization/LocalizationTypes";
import {
  SettingsStore,
  type AppSettings
} from "../../settings/AppSettings";
import {
  clearProjectAutosave,
  hasProjectAutosave,
  loadProjectAutosave,
  saveProjectAutosave
} from "../ProjectAutosave";
import type { MineMotionProject } from "../ProjectFile";
import { createInitialProject } from "../ProjectStore";
import {
  createLegacyProjectArtifact,
  createProjectPackageArtifact,
  createRecentProjectEntry,
  parseProjectWorkspaceBytes
} from "./ProjectWorkspacePersistence";

export type ProjectUpdater =
  | MineMotionProject
  | ((currentProject: MineMotionProject) => MineMotionProject);

export interface ProjectReplacementOptions {
  beforeReplace?: () => void;
  dirty?: boolean;
}

interface ProjectWorkspaceOptions {
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  setStatus: (status: string) => void;
  tr: (key: TranslationKey, values?: TranslationValues) => string;
  diagnostic: (
    code: LocalizationDiagnosticCode,
    key: TranslationKey,
    values?: TranslationValues
  ) => string;
}

export interface ProjectWorkspaceController {
  project: MineMotionProject;
  projectRef: MutableRefObject<MineMotionProject>;
  projectInputRef: MutableRefObject<HTMLInputElement | null>;
  isDirty: boolean;
  recoveryCandidate: import("../ProjectAutosave").LoadedProjectAutosave | null;
  recoveryError: string;
  replacementVersion: number;
  setDirty: Dispatch<SetStateAction<boolean>>;
  setProject: (updater: ProjectUpdater) => void;
  commitProject: (updater: ProjectUpdater, label: string) => boolean;
  confirmDiscardChanges: () => boolean;
  replaceProject: (
    nextProject: MineMotionProject,
    label: string,
    options?: ProjectReplacementOptions
  ) => boolean;
  createNewProject: (beforeReplace?: () => void) => boolean;
  saveProject: () => Promise<void>;
  exportLegacyProject: () => void;
  openProjectPicker: () => Promise<void>;
  loadProjectFile: (
    file: File,
    beforeReplace?: () => void
  ) => Promise<boolean>;
  undo: () => void;
  redo: () => void;
  restoreRecovery: () => void;
  discardRecovery: () => void;
}

export function useProjectWorkspaceController({
  settings,
  setSettings,
  setStatus,
  tr,
  diagnostic
}: ProjectWorkspaceOptions): ProjectWorkspaceController {
  const [project, setProjectState] = useState<MineMotionProject>(() =>
    createInitialProject(settings)
  );
  const [isDirty, setIsDirty] = useState(false);
  const [replacementVersion, setReplacementVersion] = useState(0);
  const [recoveryCandidate, setRecoveryCandidate] = useState<import("../ProjectAutosave").LoadedProjectAutosave | null>(null);
  const [recoveryError, setRecoveryError] = useState("");
  const historyRef = useRef(new HistoryStack<MineMotionProject>());
  const projectRef = useRef(project);
  const projectInputRef = useRef<HTMLInputElement | null>(null);

  const setProject = useCallback((updater: ProjectUpdater) => {
    const currentProject = projectRef.current;
    const nextProject =
      typeof updater === "function" ? updater(currentProject) : updater;
    projectRef.current = nextProject;
    setProjectState(nextProject);
  }, []);

  const commitProject = useCallback(
    (updater: ProjectUpdater, label: string) => {
      const currentProject = projectRef.current;
      const nextProject =
        typeof updater === "function" ? updater(currentProject) : updater;
      if (nextProject === currentProject) return false;

      historyRef.current.push(currentProject, label);
      setProject(nextProject);
      setIsDirty(true);
      return true;
    },
    [setProject]
  );

  const confirmDiscardChanges = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(tr("app.confirmDiscard"));
  }, [isDirty, tr]);

  const replaceProject = useCallback(
    (
      nextProject: MineMotionProject,
      label: string,
      options: ProjectReplacementOptions = {}
    ) => {
      if (!confirmDiscardChanges()) return false;
      options.beforeReplace?.();
      historyRef.current.clear();
      setProject(nextProject);
      setIsDirty(options.dirty ?? true);
      setReplacementVersion((version) => version + 1);
      setStatus(label);
      return true;
    },
    [confirmDiscardChanges, setProject, setStatus]
  );

  const createNewProject = useCallback(
    (beforeReplace?: () => void) =>
      replaceProject(createInitialProject(settings), tr("app.newProject"), {
        beforeReplace,
        dirty: true
      }),
    [replaceProject, settings, tr]
  );

  const saveProject = useCallback(async () => {
    blurActiveElement();
    const currentProject = projectRef.current;
    const artifact = createProjectPackageArtifact(currentProject);
    let recentId = artifact.filename;
    let storageHint: import("../../settings/AppSettings").RecentProjectEntry["storageHint"] = "download";
    if (isTauriRuntimeAvailable()) {
      const path = await saveNativeFile({ suggestedName: artifact.filename, extensions: ["minemotion"], data: new Uint8Array(await artifact.blob.arrayBuffer()) });
      if (!path) { setStatus("Save cancelled."); return; }
      recentId = path;
      storageHint = "native";
    } else {
      downloadBrowserBlob(artifact.blob, artifact.filename);
    }
    setSettings((currentSettings) => SettingsStore.addRecentProject(currentSettings, createRecentProjectEntry(currentProject, recentId, storageHint)));
    setIsDirty(false);
    setStatus(tr("app.projectSaved", { filename: artifact.filename }));
  }, [setSettings, setStatus, tr]);

  const exportLegacyProject = useCallback(() => {
    blurActiveElement();
    try {
      const artifact = createLegacyProjectArtifact(projectRef.current);
      downloadBrowserBlob(artifact.blob, artifact.filename);
      setStatus(tr("app.legacyExported", { filename: artifact.filename }));
    } catch (error) {
      setStatus(
        diagnostic("PROJECT_SCHEMA9_VFX_UNSUPPORTED", "app.legacyVfxUnsupported")
      );
    }
  }, [diagnostic, setStatus, tr]);

  const openProjectPicker = useCallback(async () => {
    if (!isTauriRuntimeAvailable()) { projectInputRef.current?.click(); return; }
    if (!confirmDiscardChanges()) return;
    const selected = await openNativeProjectFile();
    if (!selected) return;
    try {
      const loadedProject = parseProjectWorkspaceBytes(selected.data);
      historyRef.current.clear();
      setProject(loadedProject);
      setIsDirty(false);
      setReplacementVersion((version) => version + 1);
      setSettings((currentSettings) => SettingsStore.addRecentProject(currentSettings, createRecentProjectEntry(loadedProject, selected.path, "native")));
      setStatus(tr("app.projectLoaded", { name: loadedProject.projectName }));
    } catch { setStatus(diagnostic("PROJECT_LOAD_FAILED", "app.projectLoadFailed")); }
  }, [confirmDiscardChanges, diagnostic, setProject, setSettings, setStatus, tr]);

  const loadProjectFile = useCallback(
    async (file: File, beforeReplace?: () => void) => {
      if (!confirmDiscardChanges()) return false;
      beforeReplace?.();
      try {
        const loadedProject = parseProjectWorkspaceBytes(new Uint8Array(await file.arrayBuffer()));
        historyRef.current.clear();
        setProject(loadedProject);
        setIsDirty(false);
        setReplacementVersion((version) => version + 1);
        setSettings((currentSettings) =>
          SettingsStore.addRecentProject(
            currentSettings,
            createRecentProjectEntry(loadedProject, file.name, "browser")
          )
        );
        setStatus(tr("app.projectLoaded", { name: loadedProject.projectName }));
        return true;
      } catch (error) {
        setStatus(diagnostic("PROJECT_LOAD_FAILED", "app.projectLoadFailed"));
        return false;
      }
    },
    [confirmDiscardChanges, diagnostic, setProject, setSettings, setStatus, tr]
  );

  const undo = useCallback(() => {
    const previousProject = historyRef.current.undo(projectRef.current);
    if (!previousProject) {
      setStatus(tr("app.nothingUndo"));
      return;
    }
    setProject(previousProject);
    setIsDirty(true);
    setStatus(tr("app.undo"));
  }, [setProject, setStatus, tr]);

  const redo = useCallback(() => {
    const nextProject = historyRef.current.redo(projectRef.current);
    if (!nextProject) {
      setStatus(tr("app.nothingRedo"));
      return;
    }
    setProject(nextProject);
    setIsDirty(true);
    setStatus(tr("app.redo"));
  }, [setProject, setStatus, tr]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasProjectAutosave(window.localStorage)) return;
    try {
      setRecoveryCandidate(loadProjectAutosave(window.localStorage));
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : diagnostic("AUTOSAVE_RECOVERY_FAILED", "app.recoveryFailed"));
    }
  }, [diagnostic]);

  const restoreRecovery = useCallback(() => {
    if (!recoveryCandidate) return;
    historyRef.current.clear();
    setProject(recoveryCandidate.project);
    setIsDirty(true);
    setReplacementVersion((version) => version + 1);
    setStatus(recoveryCandidate.source === "backup" ? tr("app.autosaveBackupRestored") : tr("app.autosaveRestored"));
    setRecoveryCandidate(null);
  }, [recoveryCandidate, setProject, setStatus, tr]);

  const discardRecovery = useCallback(() => {
    if (typeof window !== "undefined") clearProjectAutosave(window.localStorage);
    setRecoveryCandidate(null);
    setRecoveryError("");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!settings.general.autosaveEnabled || !isDirty) return;

    const interval = window.setInterval(() => {
      try {
        saveProjectAutosave(window.localStorage, project);
        setStatus(tr("app.autosaved", { name: project.projectName }));
      } catch (error) {
        setStatus(diagnostic("AUTOSAVE_SAVE_FAILED", "app.autosaveFailed"));
      }
    }, settings.general.autosaveIntervalSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [
    diagnostic,
    isDirty,
    project,
    settings.general.autosaveEnabled,
    settings.general.autosaveIntervalSeconds,
    setStatus,
    tr
  ]);

  return {
    project,
    projectRef,
    projectInputRef,
    isDirty,
    recoveryCandidate,
    recoveryError,
    replacementVersion,
    setDirty: setIsDirty,
    setProject,
    commitProject,
    confirmDiscardChanges,
    replaceProject,
    createNewProject,
    saveProject,
    exportLegacyProject,
    openProjectPicker,
    loadProjectFile,
    undo,
    redo,
    restoreRecovery,
    discardRecovery
  };
}

function blurActiveElement(): void {
  if (
    typeof document !== "undefined" &&
    document.activeElement instanceof HTMLElement
  ) {
    document.activeElement.blur();
  }
}
