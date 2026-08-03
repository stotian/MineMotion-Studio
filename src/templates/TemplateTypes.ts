import type { AppSettings } from "../settings/AppSettings";
import type { MineMotionProject } from "../project/ProjectFile";

export type TemplateCategory = "starter" | "animation" | "cinematic" | "mood";
export type TemplateLicense = "CC0-1.0" | "MIT" | "MineMotion-generated";

export interface TemplateDependency {
  id: string;
  kind: "builtin" | "generated" | "optional";
  required: boolean;
  description: string;
}

export interface TemplatePreviewMetadata {
  accent: string;
  icon: "empty" | "dialogue" | "fight" | "horror" | "chase" | "boss" | "trailer" | "thumbnail" | "vertical" | "world" | "camera" | "character" | "mood";
  aspectRatio: string;
  summary: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  schemaVersion: 1;
  templateVersion: number;
  preview: TemplatePreviewMetadata;
  dependencies: TemplateDependency[];
  estimatedSizeBytes: number;
  license: TemplateLicense;
  attribution: string;
  tutorialId?: string;
  tags: string[];
  create: (settings?: AppSettings) => MineMotionProject;
}

export interface CustomTemplatePackage {
  format: "minemotion-template";
  packageVersion: 1;
  template: Omit<ProjectTemplate, "create">;
  projectJson: string;
  createdAt: string;
}
