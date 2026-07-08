import { describe, expect, it } from "vitest";
import { createInitialProject } from "./ProjectStore";
import { ProjectSerializer } from "./ProjectSerializer";

describe("ProjectSerializer", () => {
  it("round-trips a schema v1 project", () => {
    const project = createInitialProject();
    const raw = ProjectSerializer.serialize(project);
    const parsed = ProjectSerializer.parse(raw);

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.projectName).toBe(project.projectName);
    expect(parsed.scene.characters).toHaveLength(1);
    expect(parsed.animation.fps).toBe(24);
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

