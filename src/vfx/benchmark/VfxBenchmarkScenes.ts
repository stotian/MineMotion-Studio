import { createEffectInstance } from "../../effects/EffectRegistry";
import type { EffectType } from "../../effects/EffectTypes";
import { syncEffectTimelineLane } from "../../effects/EffectTimelineTrack";
import type { MineMotionProject } from "../../project/ProjectFile";
import { createInitialProject } from "../../project/ProjectStore";
import type { VfxFrameWork } from "../runtime/VfxFrameBudget";
import { normalizeEffectsForSchema10 } from "../serialization/VfxProjectMigration";

export const VFX_BENCHMARK_SCENE_VERSION = 1 as const;

export interface VfxBenchmarkSceneExpectation {
  requested: VfxFrameWork;
  allocated: VfxFrameWork;
  droppedEffects: number;
  limitHits: VfxFrameWork;
}

export interface VfxBenchmarkScene {
  version: typeof VFX_BENCHMARK_SCENE_VERSION;
  id: string;
  name: string;
  description: string;
  frame: number;
  expected: VfxBenchmarkSceneExpectation;
  createProject(): MineMotionProject;
}

function createBenchmarkProject(
  sceneId: string,
  effectTypes: readonly EffectType[]
): MineMotionProject {
  const project = createInitialProject();
  const targetId = "character_vfx_benchmark";
  project.projectName = `VFX Benchmark - ${sceneId}`;
  project.projectSettings.projectName = project.projectName;
  project.scene.characters[0].id = targetId;
  project.metadata.createdAt = "2026-01-01T00:00:00.000Z";
  project.metadata.updatedAt = "2026-01-01T00:00:00.000Z";
  project.effects.instances = normalizeEffectsForSchema10(effectTypes.map((type, index) =>
    createEffectInstance(type, {
      id: `benchmark_${sceneId}_${index.toString().padStart(2, "0")}`,
      startFrame: 0,
      targetObjectId: targetId,
      position: [(index % 8) * 2 - 7, 1 + Math.floor(index / 8), -Math.floor(index / 8) * 2]
    })
  ));
  return syncEffectTimelineLane(project);
}

function repeated(type: EffectType, count: number): EffectType[] {
  return Array.from({ length: count }, () => type);
}

const SCENES = Object.freeze([
  {
    version: VFX_BENCHMARK_SCENE_VERSION,
    id: "family-showcase",
    name: "Seven-Family Showcase",
    description: "One stable native preset from every Phase 16 content family.",
    frame: 4,
    expected: {
      requested: { effects: 7, particles: 196, segments: 608, stackWork: 811 },
      allocated: { effects: 7, particles: 196, segments: 608, stackWork: 811 },
      droppedEffects: 0,
      limitHits: { effects: 0, particles: 0, segments: 0, stackWork: 0 }
    },
    createProject: () => createBenchmarkProject("family-showcase", [
      "combatImpact",
      "electricStrike",
      "nativeExplosion",
      "magicPortal",
      "environmentFireflies",
      "nativeScreenFlash",
      "movementElytraTrail"
    ])
  },
  {
    version: VFX_BENCHMARK_SCENE_VERSION,
    id: "dense-particles",
    name: "Dense Rain Particle Cap",
    description: "Forty native rain volumes exercise deterministic partial particle allocation.",
    frame: 20,
    expected: {
      requested: { effects: 40, particles: 4_800, segments: 0, stackWork: 4_840 },
      allocated: { effects: 35, particles: 4_096, segments: 0, stackWork: 4_131 },
      droppedEffects: 5,
      limitHits: { effects: 0, particles: 6, segments: 0, stackWork: 0 }
    },
    createProject: () => createBenchmarkProject("dense-particles", repeated("environmentRain", 40))
  },
  {
    version: VFX_BENCHMARK_SCENE_VERSION,
    id: "dense-segments",
    name: "Dense Electric Segment Cap",
    description: "Sixty electric storms stop before the complete-segment allocation cap.",
    frame: 8,
    expected: {
      requested: { effects: 60, particles: 0, segments: 10_080, stackWork: 10_140 },
      allocated: { effects: 48, particles: 0, segments: 8_064, stackWork: 8_112 },
      droppedEffects: 12,
      limitHits: { effects: 0, particles: 0, segments: 12, stackWork: 0 }
    },
    createProject: () => createBenchmarkProject("dense-segments", repeated("electricStorm", 60))
  },
  {
    version: VFX_BENCHMARK_SCENE_VERSION,
    id: "dense-balanced",
    name: "Dense Balanced Explosions",
    description: "Forty-eight layered explosions remain below all shared frame limits.",
    frame: 4,
    expected: {
      requested: { effects: 48, particles: 3_072, segments: 5_376, stackWork: 8_496 },
      allocated: { effects: 48, particles: 3_072, segments: 5_376, stackWork: 8_496 },
      droppedEffects: 0,
      limitHits: { effects: 0, particles: 0, segments: 0, stackWork: 0 }
    },
    createProject: () => createBenchmarkProject("dense-balanced", repeated("nativeExplosion", 48))
  }
] satisfies readonly VfxBenchmarkScene[]);

export function listVfxBenchmarkScenes(): readonly VfxBenchmarkScene[] {
  return SCENES;
}

export function getVfxBenchmarkScene(id: string): VfxBenchmarkScene | null {
  return SCENES.find((scene) => scene.id === id) ?? null;
}
