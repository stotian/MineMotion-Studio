import type { MineMotionProject } from "../ProjectFile";
import { collectProjectAssets } from "../../assets/library/AssetLibrary";

export interface MineMotionManifest {
  formatName: "MineMotion Studio Package";
  schemaVersion: 1;
  mineMotionVersion: string;
  createdAt: string;
  modifiedAt: string;
  projectName: string;
  author: string;
  assetCount: number;
  pluginRequirements: string[];
  warnings: string[];
  compatibility: {
    minAppVersion: string;
    projectSchemaVersion: number;
    packageEncoding: "json";
  };
}

export function createMineMotionManifest(
  project: MineMotionProject
): MineMotionManifest {
  const assets = collectProjectAssets(project);
  const now = new Date().toISOString();
  return {
    formatName: "MineMotion Studio Package",
    schemaVersion: 1,
    mineMotionVersion: project.metadata.appVersion,
    createdAt: project.metadata.createdAt,
    modifiedAt: now,
    projectName: project.projectName,
    author: project.projectSettings.author,
    assetCount: assets.records.length,
    pluginRequirements: [],
    warnings: assets.warnings,
    compatibility: {
      minAppVersion: "0.3.0",
      projectSchemaVersion: project.schemaVersion,
      packageEncoding: "json"
    }
  };
}
