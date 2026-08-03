import type { ProjectTemplate } from "./TemplateTypes";
export function migrateTemplate(template: ProjectTemplate): ProjectTemplate {
  if (template.schemaVersion !== 1) throw new Error(`Unsupported template schema ${String(template.schemaVersion)}.`);
  return { ...template, templateVersion: Math.max(1, Math.round(template.templateVersion)), tags: [...new Set(template.tags)] };
}
