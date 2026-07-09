import type { MineMotionProject } from "../ProjectFile";
import type { MineMotionManifest } from "./MineMotionManifest";

export interface MineMotionPackageData {
  packageFormat: "minemotion-package-json";
  manifest: MineMotionManifest;
  project: MineMotionProject;
  assets: {
    models: Record<string, string>;
    audio: Record<string, string>;
    thumbnails: Record<string, string>;
    metadata: Record<string, unknown>;
  };
}

export interface ProjectPackageMetadata {
  preferredFormat: ".minemotion";
  lastPackageId: string;
  lastPackagedAt: string;
  warnings: string[];
}
