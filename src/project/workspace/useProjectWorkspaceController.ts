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
  parseProjectWorkspacePayload
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
  replacementVersion: number;
  setDirty: Dispatch<SetStateAction<boolean>>;
  setProject: (updater: ProjectUpdater) => void;
  commitProject: (updater: ProjectUpdater, label: string) => boolean;
  replaceProject: (
    nextProject: MineMotionProject,
    label: string,
    options?: ProjectReplacementOptions
  ) => boolean;
  createNewProject: (beforeReplace?: () => void) => boolean;
  saveProject: () => void;
  exportLegacyProject: () => void;
  openProjectPicker: () => void;
  loadProjectFile: (file: File, beforeReplace?: () => void) => Promise<boolean>;
  undo: () => void;
  redo: () => void;
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

  const confirmDiscardChanges = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(tr("app.confirmDiscard"));
  }, [isDirty, tr]);

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
        beforeReplace
      }),
    [replaceProject, settings, tr]
  );

  const saveProject = useCallback(() => {
    blurActiveElement();
    const currentProject = projectRef.current;
    const artifact = createProjectPackageArtifact(currentProject);
    downloadBrowserBlob(artifact.blob, artifact.filename);
    setSettings((currentSettings) =>
      SettingsStore.addRecentProject(
        currentSettings,
        createRecentProjectEntry(currentProject, artifact.filename, "download")
      )
    );
    setIsDirty(false);
    setStatus(tr("app.projectSaved", { filename: artifact.filename }));
  }, [setSettings, setStatus, tr]);

  const exportLegacyProject = useCallback(() => {
    blurActiveElement();
    try {
      const artifact = createLegacyProjectArtifact(projectRef.current);
      downloadBrowserBlob(artifact.blob, artifact.filename);
      setStatus(tr("app.legacyExported", { filename: artifact.filename }));
    } catch {
      setStatus(
        diagnostic("PROJECT_SCHEMA9_VFX_UNSUPPORTED", "app.legacyVfxUnsupported")
      );
    }
  }, [diagnostic, setStatus, tr]);

  const openProjectPicker = useCallback(() => {
    projectInputRef.current?.click();
  }, []);

  const loadProjectFile = useCallback(
    async (file: File, beforeReplace?: () => void) => {
      if (!confirmDiscardChanges()) return false;
      beforeReplace?.();
      try {
        const loadedProject = parseProjectWorkspacePayload(await file.text());
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
      } catch {
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
    if (typeof window === "undefined" || !hasProjectAutosave(window.localStorage)) {
      return;
    }
    if (!window.confirm(tr("app.confirmAutosave"))) return;

    try {
      const recovered = loadProjectAutosave(window.localStorage);
      if (!recovered) return;
      historyRef.current.clear();
      setProject(recovered.project);
      setIsDirty(true);
      setReplacementVersion((version) => version + 1);
      setStatus(
        recovered.source === "backup"
          ? tr("app.autosaveBackupRestored")
          : tr("app.autosaveRestored")
      );
    } catch {
      setStatus(diagnostic("AUTOSAVE_RECOVERY_FAILED", "app.recoveryFailed"));
    }
  }, [diagnostic, setProject, setStatus, tr]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!settings.general.autosaveEnabled || !isDirty) return;

    const interval = window.setInterval(() => {
      try {
        saveProjectAutosave(window.localStorage, project);
        setStatus(tr("app.autosaved", { name: project.projectName }));
      } catch {
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
    replacementVersion,
    setDirty: setIsDirty,
    setProject,
    commitProject,
    replaceProject,
    createNewProject,
    saveProject,
    exportLegacyProject,
    openProjectPicker,
    loadProjectFile,
    undo,
    redo
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
