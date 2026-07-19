import type { MineMotionProject } from "./ProjectFile";
import { ProjectSerializer } from "./ProjectSerializer";

export const PROJECT_AUTOSAVE_KEY = "minemotion.autosave.project.v1";
export const PROJECT_AUTOSAVE_BACKUP_KEY =
  "minemotion.autosave.project.backup.v1";

export interface ProjectAutosaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LoadedProjectAutosave {
  project: MineMotionProject;
  source: "primary" | "backup";
}

export function hasProjectAutosave(storage: ProjectAutosaveStorage): boolean {
  return (
    storage.getItem(PROJECT_AUTOSAVE_KEY) !== null ||
    storage.getItem(PROJECT_AUTOSAVE_BACKUP_KEY) !== null
  );
}

export function saveProjectAutosave(
  storage: ProjectAutosaveStorage,
  project: MineMotionProject
): void {
  const serialized = ProjectSerializer.serialize(project);
  const previous = storage.getItem(PROJECT_AUTOSAVE_KEY);
  if (previous !== null) {
    storage.setItem(PROJECT_AUTOSAVE_BACKUP_KEY, previous);
  }
  try {
    storage.setItem(PROJECT_AUTOSAVE_KEY, serialized);
  } catch (error) {
    if (previous !== null) {
      try {
        storage.setItem(PROJECT_AUTOSAVE_KEY, previous);
      } catch (restoreError) {
        throw new AggregateError(
          [error, restoreError],
          "Project autosave write and rollback both failed; stored copies were not deleted."
        );
      }
    }
    throw error;
  }
}

export function loadProjectAutosave(
  storage: ProjectAutosaveStorage
): LoadedProjectAutosave | null {
  const primary = storage.getItem(PROJECT_AUTOSAVE_KEY);
  const backup = storage.getItem(PROJECT_AUTOSAVE_BACKUP_KEY);
  if (primary === null && backup === null) return null;

  let primaryError: unknown = null;
  if (primary !== null) {
    try {
      return { project: ProjectSerializer.parse(primary), source: "primary" };
    } catch (error) {
      primaryError = error;
    }
  }
  if (backup !== null) {
    try {
      return { project: ProjectSerializer.parse(backup), source: "backup" };
    } catch (error) {
      const primaryMessage =
        primaryError instanceof Error ? primaryError.message : "primary missing";
      const backupMessage = error instanceof Error ? error.message : "backup invalid";
      throw new Error(
        `Project autosave recovery failed. Primary: ${primaryMessage}. Backup: ${backupMessage}.`
      );
    }
  }

  throw primaryError instanceof Error
    ? primaryError
    : new Error("Project autosave recovery failed.");
}
