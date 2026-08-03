import type { CharacterEntity, MineMotionProject } from "../../project/ProjectFile";
import { createCharacter, createId } from "../../project/ProjectStore";
import type { CrowdPlacement, CrowdPrototypeOptions, CrowdPrototypeResult } from "./CrowdTypes";

const MAX_CROWD = 80;
export function generateCrowdPrototype(options: CrowdPrototypeOptions): CrowdPrototypeResult {
  const started = performanceNow();
  const count = Math.max(1, Math.min(MAX_CROWD, Math.round(options.count)));
  const radius = Math.max(2, Math.min(64, options.radius));
  const spacing = Math.max(0.7, Math.min(8, options.spacing));
  const random = mulberry32(options.seed >>> 0);
  const placements: CrowdPlacement[] = [];
  const maxAttempts = count * 60;
  for (let attempt = 0; placements.length < count && attempt < maxAttempts; attempt += 1) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * radius;
    const position: [number, number, number] = [options.center[0] + Math.cos(angle) * distance, options.center[1], options.center[2] + Math.sin(angle) * distance];
    if (placements.some((item) => squaredDistance(item.position, position) < spacing * spacing)) continue;
    placements.push({ index: placements.length, position, yawDegrees: Math.round(random() * 360), scale: 0.92 + random() * 0.16, variant: Math.floor(random() * 8) });
  }
  const generated = placements.length;
  return {
    placements,
    metrics: {
      requested: count,
      generated,
      estimatedSceneObjects: generated,
      estimatedCpuBytes: generated * 24_000,
      estimatedGpuBytes: generated * 8_000,
      generationMs: Math.max(0, performanceNow() - started),
      densityPerSquareBlock: generated / (Math.PI * radius * radius)
    },
    warnings: generated < count ? [`Spacing constrained the crowd to ${generated}/${count} characters.`] : []
  };
}

export function applyCrowdPrototype(project: MineMotionProject, result: CrowdPrototypeResult, sourceCharacterId?: string): MineMotionProject {
  const source = project.scene.characters.find((character) => character.id === sourceCharacterId) ?? project.scene.characters[0];
  const generated = result.placements.map((placement) => createCrowdCharacter(source, placement));
  return { ...project, scene: { ...project.scene, characters: [...project.scene.characters, ...generated] }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } };
}

function createCrowdCharacter(source: CharacterEntity | undefined, placement: CrowdPlacement): CharacterEntity {
  const base = source ? structuredClone(source) : createCharacter();
  return {
    ...base,
    id: createId("crowd"),
    name: `Crowd ${placement.index + 1}`,
    locked: false,
    metadata: { ...base.metadata, experimentalCrowd: true, crowdVariant: placement.variant },
    transform: { ...base.transform, position: [...placement.position], rotation: [base.transform.rotation[0], placement.yawDegrees, base.transform.rotation[2]], scale: [placement.scale, placement.scale, placement.scale] },
    selectedBoneId: undefined,
    boneKeyframes: []
  };
}
function squaredDistance(a: readonly number[], b: readonly number[]): number { const x=a[0]-b[0], z=a[2]-b[2]; return x*x+z*z; }
function mulberry32(seed: number): () => number { return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function performanceNow(): number { return typeof performance === "undefined" ? Date.now() : performance.now(); }
