import { describe, expect, it } from "vitest";
import { templateRegistry } from "./TemplateRegistry";

describe("TemplateRegistry", () => {
  it("creates all built-in templates as schema v9 projects", () => {
    for (const template of templateRegistry.list()) {
      const project = template.create();

      expect(project.schemaVersion).toBe(9);
      expect(project.projectName).toBeTruthy();
      expect(project.projectSettings.terrainPreset).toBeTruthy();
      expect(project.renderSettings.resolutionPreset).toBe("1080p");
    }
  });

  it("creates the empty scene without characters or terrain", () => {
    const project = templateRegistry.createProject("empty-scene");

    expect(project.scene.characters).toHaveLength(0);
    expect(project.projectSettings.terrainPreset).toBe("none");
  });
});
