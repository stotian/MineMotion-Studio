import { ProjectSerializer } from "../project/ProjectSerializer";
import type { MineMotionProject } from "../project/ProjectFile";
import type { CustomTemplatePackage, ProjectTemplate } from "./TemplateTypes";

const MAX_TEMPLATE_BYTES = 32 * 1024 * 1024;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

export function exportCustomTemplate(template: Omit<ProjectTemplate, "create">, project: MineMotionProject): string {
  const normalized = validateTemplateMetadata(template);
  const payload: CustomTemplatePackage = {
    format: "minemotion-template",
    packageVersion: 1,
    template: normalized,
    projectJson: ProjectSerializer.serialize(project),
    createdAt: new Date().toISOString()
  };
  const raw = JSON.stringify(payload, null, 2);
  if (new TextEncoder().encode(raw).byteLength > MAX_TEMPLATE_BYTES) throw new Error("Template package exceeds the 32 MiB safety limit.");
  return raw;
}

export function importCustomTemplate(raw: string): { template: ProjectTemplate; project: MineMotionProject } {
  if (new TextEncoder().encode(raw).byteLength > MAX_TEMPLATE_BYTES) throw new Error("Template package exceeds the 32 MiB safety limit.");
  const parsed = JSON.parse(raw) as Partial<CustomTemplatePackage>;
  if (parsed.format !== "minemotion-template" || parsed.packageVersion !== 1 || typeof parsed.projectJson !== "string" || !parsed.template) {
    throw new Error("Unsupported MineMotion template package.");
  }
  const metadata = validateTemplateMetadata(parsed.template);
  const project = ProjectSerializer.parse(parsed.projectJson);
  return { template: { ...metadata, create: () => ProjectSerializer.parse(parsed.projectJson!) }, project };
}

export function createCustomTemplateMetadata(id: string, name: string, description: string): Omit<ProjectTemplate, "create"> {
  return validateTemplateMetadata({
    id, name, description, category: "starter", schemaVersion: 1, templateVersion: 1,
    preview: { accent: "#66a3ff", icon: "empty", aspectRatio: "16:9", summary: description },
    dependencies: [], estimatedSizeBytes: 0, license: "MineMotion-generated",
    attribution: "Created by the user in MineMotion Studio.", tags: ["custom"]
  });
}

export function validateTemplateMetadata(value: Omit<ProjectTemplate, "create">): Omit<ProjectTemplate, "create"> {
  if (!ID_PATTERN.test(value.id)) throw new Error("Template id must use lowercase letters, numbers and hyphens.");
  if (!value.name.trim() || !value.description.trim()) throw new Error("Template name and description are required.");
  if (value.schemaVersion !== 1 || !Number.isInteger(value.templateVersion) || value.templateVersion < 1) throw new Error("Unsupported template schema or version.");
  return {
    ...value,
    name: value.name.trim().slice(0, 120), description: value.description.trim().slice(0, 600),
    dependencies: value.dependencies.slice(0, 64).map((dependency) => ({ ...dependency, id: dependency.id.slice(0, 128), description: dependency.description.slice(0, 400) })),
    estimatedSizeBytes: Math.max(0, Math.round(value.estimatedSizeBytes)),
    tags: [...new Set(value.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 24)
  };
}
