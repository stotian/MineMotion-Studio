import { describe, expect, it } from "vitest";
import { DEFAULT_APP_SETTINGS } from "../../settings/AppSettings";
import { createInitialProject, updateProjectSettings } from "../ProjectStore";
import {
  createLegacyProjectArtifact,
  createProjectPackageArtifact,
  createRecentProjectEntry,
  parseProjectWorkspaceBytes,
  parseProjectWorkspacePayload
} from "./ProjectWorkspacePersistence";

describe("ProjectWorkspacePersistence", () => {
  it("creates a portable package artifact that reopens without project loss", async () => {
    const project = updateProjectSettings(
      createInitialProject(DEFAULT_APP_SETTINGS),
      { projectName: "Cinematic Test / 01" }
    );

    const artifact = createProjectPackageArtifact(project);
    const reopened = parseProjectWorkspaceBytes(
      new Uint8Array(await artifact.blob.arrayBuffer())
    );

    expect(artifact.filename).toBe("cinematic-test-01.minemotion");
    expect(artifact.blob.type).toBe("application/vnd.minemotion.package+json");
    expect(reopened.projectName).toBe(project.projectName);
    expect(reopened.projectSettings).toEqual(project.projectSettings);
    expect(reopened.scene.cameras).toEqual(project.scene.cameras);
    expect(reopened.scene.characters[0]?.id).toBe(project.scene.characters[0]?.id);
    expect(reopened.packageMetadata.lastPackageId).not.toBe("");
    expect(reopened.packageMetadata.lastPackagedAt).not.toBe("");
  });

  it("creates a schema 9 artifact only when the project is representable", async () => {
    const project = updateProjectSettings(
      createInitialProject(DEFAULT_APP_SETTINGS),
      { projectName: "Legacy Export" }
    );

    const artifact = createLegacyProjectArtifact(project);
    const reopened = parseProjectWorkspacePayload(await artifact.blob.text());

    expect(artifact.filename).toBe("legacy-export.mmsproj");
    expect(reopened.projectName).toBe(project.projectName);
    expect(reopened.schemaVersion).toBe(10);
  });

  it("records deterministic recent-project metadata supplied by the caller", () => {
    const project = createInitialProject(DEFAULT_APP_SETTINGS);
    const entry = createRecentProjectEntry(
      project,
      "demo.minemotion",
      "download",
      "2026-07-29T12:00:00.000Z"
    );

    expect(entry).toEqual({
      id: "demo.minemotion",
      name: project.projectName,
      savedAt: "2026-07-29T12:00:00.000Z",
      storageHint: "download"
    });
  });
});
