import { templateRegistry } from "../templates/TemplateRegistry";
export interface GoldenProject { id: string; templateId: string; areas: string[]; expected: { minShots: number; minCameras: number; minEffects: number; }; }
export const GOLDEN_PROJECTS: GoldenProject[] = [
  { id: "golden-dialogue", templateId: "dialogue-scene", areas: ["rig", "animation", "audio", "shots"], expected: { minShots: 3, minCameras: 3, minEffects: 0 } },
  { id: "golden-fight", templateId: "fight-scene", areas: ["rig", "animation", "vfx", "audio", "export"], expected: { minShots: 4, minCameras: 2, minEffects: 4 } },
  { id: "golden-world", templateId: "flat-minecraft-world", areas: ["world", "lighting", "camera"], expected: { minShots: 0, minCameras: 1, minEffects: 0 } },
  { id: "golden-production", templateId: "boss-battle", areas: ["shots", "vfx", "audio", "render-passes"], expected: { minShots: 5, minCameras: 3, minEffects: 5 } }
];
export function validateGoldenProjects(): string[] {
  const errors: string[] = [];
  for (const golden of GOLDEN_PROJECTS) {
    const project = templateRegistry.createProject(golden.templateId);
    if (project.production.shots.length < golden.expected.minShots) errors.push(`${golden.id}: insufficient shots`);
    if (project.scene.cameras.length < golden.expected.minCameras) errors.push(`${golden.id}: insufficient cameras`);
    if (project.effects.instances.length < golden.expected.minEffects) errors.push(`${golden.id}: insufficient effects`);
  }
  return errors;
}
