import type { MineMotionProject } from "../project/ProjectFile";
import type { ExportSettings, ExportValidationResult } from "./ExportTypes";
import { validateExportSettings } from "./ExportSettings";

export class ExportManager {
  static validate(
    project: MineMotionProject,
    settings: ExportSettings
  ): ExportValidationResult {
    return validateExportSettings(settings, project);
  }

  static frameCount(settings: ExportSettings): number {
    return Math.max(1, settings.endFrame - settings.startFrame + 1);
  }
}
