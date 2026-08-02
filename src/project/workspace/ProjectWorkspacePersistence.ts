import { sanitizeOutputName } from "../../export/ExportSettings";
import type { RecentProjectEntry } from "../../settings/AppSettings";
import type { MineMotionProject } from "../ProjectFile";
import { ProjectSerializer } from "../ProjectSerializer";
import { PackageReader } from "../package/PackageReader";
import { PackageWriter } from "../package/PackageWriter";

export interface ProjectDownloadArtifact {
  blob: Blob;
  filename: string;
}

export function createProjectPackageArtifact(
  project: MineMotionProject
): ProjectDownloadArtifact {
  return {
    blob: PackageWriter.write(project),
    filename: `${sanitizeOutputName(project.projectName)}.minemotion`
  };
}

export function createLegacyProjectArtifact(
  project: MineMotionProject
): ProjectDownloadArtifact {
  const raw = ProjectSerializer.serializeLegacyV9(project);
  return {
    blob: new Blob([raw], { type: "application/json" }),
    filename: `${sanitizeOutputName(project.projectName)}.mmsproj`
  };
}

export function parseProjectWorkspacePayload(raw: string): MineMotionProject {
  return PackageReader.looksLikePackage(raw)
    ? PackageReader.parse(raw)
    : ProjectSerializer.parse(raw);
}

export function parseProjectWorkspaceBytes(bytes: Uint8Array): MineMotionProject {
  return parseProjectWorkspacePayload(new TextDecoder().decode(bytes));
}

export function createRecentProjectEntry(
  project: MineMotionProject,
  id: string,
  storageHint: RecentProjectEntry["storageHint"],
  savedAt = new Date().toISOString()
): RecentProjectEntry {
  return {
    id,
    name: project.projectName,
    savedAt,
    storageHint
  };
}
