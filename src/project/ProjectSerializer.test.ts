import { describe, expect, it } from "vitest";
import { createInitialProject } from "./ProjectStore";
import { ProjectSerializer } from "./ProjectSerializer";

describe("ProjectSerializer", () => {
  it("round-trips a schema v2 project", () => {
    const project = createInitialProject();
    const raw = ProjectSerializer.serialize(project);
    const parsed = ProjectSerializer.parse(raw);

    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.projectSettings.schemaVersion).toBe(1);
    expect(parsed.projectName).toBe(project.projectName);
    expect(parsed.scene.characters).toHaveLength(1);
    expect(parsed.animation.fps).toBe(24);
  });

  it("migrates a schema v1 project with fallback project settings", () => {
    const project = createInitialProject();
    const legacy = {
      ...project,
      schemaVersion: 1,
      projectSettings: undefined,
      scene: {
        characters: project.scene.characters.map(({ locked: _locked, metadata: _metadata, ...entity }) => entity),
        cameras: project.scene.cameras.map(({ locked: _locked, metadata: _metadata, ...entity }) => entity),
        importedObjects: [],
        lights: project.scene.lights.map(({ locked: _locked, metadata: _metadata, ...entity }) => entity)
      }
    };

    const parsed = ProjectSerializer.parse(JSON.stringify(legacy));

    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.projectSettings.projectName).toBe(project.projectName);
    expect(parsed.projectSettings.fps).toBe(project.animation.fps);
    expect(parsed.scene.characters[0].locked).toBe(false);
    expect(parsed.scene.characters[0].metadata).toEqual({});
  });

  it("rejects invalid project JSON", () => {
    expect(() =>
      ProjectSerializer.parse(
        JSON.stringify({
            schemaVersion: 1,
            projectName: "Broken"
        })
      )
    ).toThrow(/required scene data/i);
  });
});
