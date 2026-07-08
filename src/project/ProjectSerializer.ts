import type { MineMotionProject } from "./ProjectFile";
import { createDefaultProjectSettings } from "./ProjectStore";

const CURRENT_SCHEMA_VERSION = 2;

type LegacyProjectV1 = Omit<
  MineMotionProject,
  "schemaVersion" | "projectSettings"
> & {
  schemaVersion: 1;
  projectSettings?: never;
};

export class ProjectSerializer {
  static serialize(project: MineMotionProject): string {
    const updatedProject: MineMotionProject = {
      ...project,
      metadata: {
        ...project.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    return JSON.stringify(updatedProject, null, 2);
  }

  static parse(raw: string): MineMotionProject {
    const parsed = JSON.parse(raw) as Partial<MineMotionProject> | LegacyProjectV1;

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Project file is not a JSON object.");
    }

    if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return ProjectSerializer.migrate(parsed);
    }

    const project = ProjectSerializer.withV2Defaults(parsed);
    ProjectSerializer.assertValidProject(project);
    return project;
  }

  private static migrate(
    parsed: Partial<MineMotionProject> | LegacyProjectV1
  ): MineMotionProject {
    if (parsed.schemaVersion === 1) {
      return ProjectSerializer.migrateV1(parsed as LegacyProjectV1);
    }

    if (parsed.schemaVersion === undefined) {
      throw new Error("Unsupported project file: missing schemaVersion.");
    }

    throw new Error(
      `Unsupported project schema version: ${String(parsed.schemaVersion)}.`
    );
  }

  private static migrateV1(project: LegacyProjectV1): MineMotionProject {
    const settings = createDefaultProjectSettings();
    const migrated: MineMotionProject = {
      ...project,
      schemaVersion: 2,
      projectSettings: {
        ...settings,
        projectName: project.projectName,
        fps: project.animation?.fps ?? settings.fps,
        durationFrames:
          project.animation?.durationFrames ?? settings.durationFrames,
        defaultSkyPreset: project.sky?.preset ?? settings.defaultSkyPreset,
        worldSourcePath: project.world?.sourcePath ?? ""
      },
      scene: {
        characters: (project.scene?.characters ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        })),
        cameras: (project.scene?.cameras ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        })),
        importedObjects: (project.scene?.importedObjects ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        })),
        lights: (project.scene?.lights ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        }))
      }
    };

    ProjectSerializer.assertValidProject(migrated);
    return migrated;
  }

  private static withV2Defaults(
    project: Partial<MineMotionProject>
  ): MineMotionProject {
    const defaults = createDefaultProjectSettings();
    const projectSettings = {
      ...defaults,
      ...project.projectSettings,
      projectName: project.projectSettings?.projectName ?? project.projectName ?? defaults.projectName,
      fps: project.projectSettings?.fps ?? project.animation?.fps ?? defaults.fps,
      durationFrames:
        project.projectSettings?.durationFrames ??
        project.animation?.durationFrames ??
        defaults.durationFrames
    };

    return {
      ...(project as MineMotionProject),
      schemaVersion: 2,
      projectName: projectSettings.projectName,
      projectSettings,
      scene: {
        characters: (project.scene?.characters ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        })),
        cameras: (project.scene?.cameras ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        })),
        importedObjects: (project.scene?.importedObjects ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        })),
        lights: (project.scene?.lights ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        }))
      }
    };
  }

  private static assertValidProject(
    project: Partial<MineMotionProject>
  ): asserts project is MineMotionProject {
    if (project.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      throw new Error("Project file did not migrate to current schema.");
    }

    if (!project.projectName) {
      throw new Error("Project file is missing projectName.");
    }

    if (!project.projectSettings) {
      throw new Error("Project file is missing projectSettings.");
    }

    if (!project.scene || !project.animation || !project.assets) {
      throw new Error("Project file is missing required scene data.");
    }

    if (!Array.isArray(project.animation.tracks)) {
      throw new Error("Project file animation.tracks must be an array.");
    }
  }
}
