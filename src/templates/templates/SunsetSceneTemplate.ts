import type { ProjectTemplate } from "../TemplateTypes";
import { createInitialProject, updateProjectSettings } from "../../project/ProjectStore";

export const SunsetSceneTemplate: ProjectTemplate = {
  id: "sunset-showcase",
  name: "Sunset Showcase",
  description: "Warm sky, terrain, character, and cinematic camera.",
  category: "mood",
  create(settings) {
    const project = updateProjectSettings(createInitialProject(settings), {
      projectName: "Sunset Showcase",
      defaultSkyPreset: "Sunset",
      terrainPreset: "demo"
    });
    return {
      ...project,
      sky: {
        ...project.sky,
        preset: "Sunset"
      },
      scene: {
        ...project.scene,
        cameras: project.scene.cameras.map((camera) => ({
          ...camera,
          transform: {
            ...camera.transform,
            position: [7, 4.5, 9],
            rotation: [-20, 38, 0]
          },
          fov: 40
        }))
      }
    };
  }
};

