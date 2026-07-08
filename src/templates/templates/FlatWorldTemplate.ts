import type { ProjectTemplate } from "../TemplateTypes";
import { createInitialProject, updateProjectSettings } from "../../project/ProjectStore";

export const FlatWorldTemplate: ProjectTemplate = {
  id: "flat-minecraft-world",
  name: "Flat Minecraft World",
  description: "Flat grass and dirt test world with one camera and light.",
  category: "starter",
  create(settings) {
    return updateProjectSettings(createInitialProject(settings), {
      projectName: "Flat Minecraft World",
      terrainPreset: "flat"
    });
  }
};

