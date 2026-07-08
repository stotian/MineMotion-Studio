import type { AppSettings } from "../settings/AppSettings";
import type { MineMotionProject } from "../project/ProjectFile";
import type { ProjectTemplate } from "./TemplateTypes";
import { CharacterAnimationTemplate } from "./templates/CharacterAnimationTemplate";
import { CinematicCameraTemplate } from "./templates/CinematicCameraTemplate";
import { EmptySceneTemplate } from "./templates/EmptySceneTemplate";
import { FlatWorldTemplate } from "./templates/FlatWorldTemplate";
import { NetherMoodTemplate } from "./templates/NetherMoodTemplate";
import { SunsetSceneTemplate } from "./templates/SunsetSceneTemplate";

export class TemplateRegistry {
  private readonly templates = new Map<string, ProjectTemplate>();

  constructor(initialTemplates: ProjectTemplate[] = BUILTIN_TEMPLATES) {
    initialTemplates.forEach((template) => this.register(template));
  }

  register(template: ProjectTemplate): void {
    this.templates.set(template.id, template);
  }

  list(): ProjectTemplate[] {
    return [...this.templates.values()];
  }

  get(templateId: string): ProjectTemplate | undefined {
    return this.templates.get(templateId);
  }

  createProject(templateId: string, settings?: AppSettings): MineMotionProject {
    const template = this.get(templateId);
    if (!template) {
      throw new Error(`Unknown project template: ${templateId}`);
    }
    return template.create(settings);
  }
}

export const BUILTIN_TEMPLATES: ProjectTemplate[] = [
  EmptySceneTemplate,
  FlatWorldTemplate,
  CharacterAnimationTemplate,
  CinematicCameraTemplate,
  SunsetSceneTemplate,
  NetherMoodTemplate
];

export const templateRegistry = new TemplateRegistry();

