import type { ProjectTemplate } from "../TemplateTypes";
import { createInitialProject, updateProjectSettings } from "../../project/ProjectStore";

export const EmptySceneTemplate: ProjectTemplate = {
  id: "empty-scene",
  name: "Empty Scene",
  description: "Grid, default camera, default sky, no terrain or characters.",
  category: "starter",
  create(settings) {
    const project = createInitialProject(settings);
    return updateProjectSettings(
      {
        ...project,
        scene: {
          ...project.scene,
          characters: []
        }
      },
      {
        projectName: "Empty Scene",
        terrainPreset: "none"
      }
    );
  }
};

