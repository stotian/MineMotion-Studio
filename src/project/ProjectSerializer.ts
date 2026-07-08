import type { MineMotionProject } from "./ProjectFile";

const CURRENT_SCHEMA_VERSION = 1;

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
    const parsed = JSON.parse(raw) as Partial<MineMotionProject>;

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Project file is not a JSON object.");
    }

    if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return ProjectSerializer.migrate(parsed);
    }

    ProjectSerializer.assertValidProject(parsed);
    return parsed;
  }

  private static migrate(
    parsed: Partial<MineMotionProject>
  ): MineMotionProject {
    if (parsed.schemaVersion === undefined) {
      throw new Error("Unsupported project file: missing schemaVersion.");
    }

    throw new Error(
      `Unsupported project schema version: ${String(parsed.schemaVersion)}.`
    );
  }

  private static assertValidProject(
    project: Partial<MineMotionProject>
  ): asserts project is MineMotionProject {
    if (!project.projectName) {
      throw new Error("Project file is missing projectName.");
    }

    if (!project.scene || !project.animation || !project.assets) {
      throw new Error("Project file is missing required scene data.");
    }

    if (!Array.isArray(project.animation.tracks)) {
      throw new Error("Project file animation.tracks must be an array.");
    }
  }
}

