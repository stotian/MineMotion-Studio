import type { ProjectTemplate } from "./TemplateTypes";

export interface CreatorContentPack {
  id: string; name: string; kind: "camera" | "lighting" | "pose" | "animation" | "vfx" | "world" | "export";
  version: number; license: "CC0-1.0" | "MIT" | "MineMotion-generated"; attribution: string; dataOnly: true; entries: string[];
}
export interface TutorialProject { id: string; level: "beginner" | "advanced"; templateId: string; steps: string[]; expectedMarkers: string[]; }
export const FIRST_PARTY_CONTENT_PACKS: CreatorContentPack[] = [
  { id: "camera-basics", name: "Camera Basics", kind: "camera", version: 1, license: "CC0-1.0", attribution: "MineMotion contributors", dataOnly: true, entries: ["wide", "medium", "close-up", "low-angle"] },
  { id: "lighting-moods", name: "Lighting Moods", kind: "lighting", version: 1, license: "CC0-1.0", attribution: "MineMotion contributors", dataOnly: true, entries: ["clear-day", "golden-hour", "horror-fog", "storm-fight"] },
  { id: "generated-poses", name: "Generated Poses", kind: "pose", version: 1, license: "MineMotion-generated", attribution: "Procedurally authored for MineMotion", dataOnly: true, entries: ["idle", "talk", "run", "impact"] },
  { id: "generated-animation", name: "Generated Animation", kind: "animation", version: 1, license: "MineMotion-generated", attribution: "Procedurally authored for MineMotion", dataOnly: true, entries: ["idle-loop", "walk-cycle", "camera-orbit"] },
  { id: "procedural-vfx", name: "Procedural VFX", kind: "vfx", version: 1, license: "MIT", attribution: "MineMotion built-in VFX", dataOnly: true, entries: ["impactFrame", "shockwave", "glowBurst", "fogPulse"] },
  { id: "generated-worlds", name: "Generated Worlds", kind: "world", version: 1, license: "MineMotion-generated", attribution: "Original generated block layouts; no Minecraft data bundled", dataOnly: true, entries: ["flat-stage", "arena-blockout", "corridor-blockout"] },
  { id: "export-presets", name: "Export Presets", kind: "export", version: 1, license: "CC0-1.0", attribution: "MineMotion contributors", dataOnly: true, entries: ["preview-720p", "production-1080p", "vertical-1080x1920", "thumbnail-png"] }
];
export const TUTORIAL_PROJECTS: TutorialProject[] = [
  { id: "tutorial-dialogue-basics", level: "beginner", templateId: "dialogue-scene", steps: ["Open the template", "Scrub dialogue markers", "Adjust one camera", "Validate and export SH010"], expectedMarkers: ["Speaker A", "Speaker B"] },
  { id: "tutorial-action-timing", level: "beginner", templateId: "fight-scene", steps: ["Inspect action beats", "Move the impact marker", "Preview VFX", "Render the beauty pass"], expectedMarkers: ["Impact"] },
  { id: "tutorial-boss-production", level: "advanced", templateId: "boss-battle", steps: ["Review storyboard", "Duplicate a take", "Tune per-shot post", "Render all passes"], expectedMarkers: ["Boss reveal", "Finisher"] }
];
export const BENCHMARK_TEMPLATE_IDS = ["fight-scene", "boss-battle", "trailer-scene"] as const;
export function validateShippedTemplate(template: ProjectTemplate): string[] {
  const errors: string[] = [];
  const project = template.create();
  if (!project.projectName || project.schemaVersion !== 10) errors.push(`${template.id}: invalid project schema`);
  if (!template.license || !template.attribution) errors.push(`${template.id}: missing license metadata`);
  if (template.dependencies.some((dependency) => /(https?:\/\/)?(textures\.minecraft\.net|assets\.mojang\.com)|embedded proprietary/i.test(dependency.description))) errors.push(`${template.id}: proprietary dependency declaration`);
  if (project.assets.skins.some((skin) => Boolean(skin.dataUrl))) errors.push(`${template.id}: embedded skin data is forbidden in shipped samples`);
  return errors;
}
