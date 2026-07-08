import type { ProjectTemplate } from "../TemplateTypes";
import { createInitialProject, updateProjectSettings } from "../../project/ProjectStore";

export const NetherMoodTemplate: ProjectTemplate = {
  id: "nether-mood",
  name: "Nether Mood",
  description: "Nether-inspired sky, darker terrain palette, and low lighting.",
  category: "mood",
  create(settings) {
    const project = updateProjectSettings(createInitialProject(settings), {
      projectName: "Nether Mood",
      defaultSkyPreset: "Nether",
      terrainPreset: "nether",
      blockPaletteStyle: "nether"
    });
    return {
      ...project,
      sky: {
        ...project.sky,
        preset: "Nether",
        customColor: "#3b1010"
      }
    };
  }
};

