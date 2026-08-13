import type {
  CharacterEntity,
  LightEntity,
  MineMotionProject,
  ObjEntity
} from "../project/ProjectFile";
import {
  createCharacter,
  createInitialProject,
  createObjEntity
} from "../project/ProjectStore";
import { ProjectSerializer } from "../project/ProjectSerializer";
import type { ImportedChunkData } from "../minecraft/import/MinecraftChunkTypes";
import {
  getVfxBenchmarkScene,
  type VfxBenchmarkSceneExpectation
} from "../vfx/benchmark/VfxBenchmarkScenes";
import type { PerformanceBudgetId } from "./PerformanceBudgets";
import type { ProjectComplexityMetrics } from "./RendererMetrics";

export const PERFORMANCE_BENCHMARK_SCENE_VERSION = 1 as const;

export const PERFORMANCE_BENCHMARK_IDS = Object.freeze([
  "small",
  "medium",
  "large-world",
  "vfx-fight",
  "storm"
] as const);

export type PerformanceBenchmarkId =
  (typeof PERFORMANCE_BENCHMARK_IDS)[number];

export interface PerformanceBenchmarkExpectation {
  readonly project: ProjectComplexityMetrics;
  readonly draftBudgetStatus: "pass" | "recommendation" | "limit";
  readonly vfx: VfxBenchmarkSceneExpectation | null;
}

export interface PerformanceBenchmarkScene {
  readonly version: typeof PERFORMANCE_BENCHMARK_SCENE_VERSION;
  readonly id: PerformanceBenchmarkId;
  readonly name: string;
  readonly description: string;
  readonly frame: number;
  readonly budgetId: PerformanceBudgetId;
  readonly sceneObjectEstimate: number;
  readonly expected: PerformanceBenchmarkExpectation;
  createProject(): MineMotionProject;
}

const FIXED_TIME = "2026-01-01T00:00:00.000Z";

const SCENES = Object.freeze([
  createScene({
    id: "small",
    name: "Small Editing Shot",
    description: "One character, one camera, one light, and no imported world or VFX.",
    frame: 0,
    budgetId: "draft",
    sceneObjectEstimate: 120,
    chunks: 0,
    extraCharacters: 0,
    extraObjects: 0,
    extraLights: 0,
    vfxBenchmarkId: null,
    expected: {
      project: complexity(3, 3, 120, 0, 0, 0),
      draftBudgetStatus: "pass",
      vfx: null
    }
  }),
  createScene({
    id: "medium",
    name: "Medium Cinematic Scene",
    description: "A small cast, props, eight chunks, and one effect from every stable VFX family.",
    frame: 4,
    budgetId: "draft",
    sceneObjectEstimate: 8_000,
    chunks: 8,
    extraCharacters: 1,
    extraObjects: 4,
    extraLights: 1,
    vfxBenchmarkId: "family-showcase",
    expected: {
      project: complexity(9, 9, 8_000, 8, 7, 7),
      draftBudgetStatus: "pass",
      vfx: requireVfxExpectation("family-showcase")
    }
  }),
  createScene({
    id: "large-world",
    name: "Large Imported World",
    description: "Sixty-four imported chunks with a larger cast and prop layout.",
    frame: 4,
    budgetId: "draft",
    sceneObjectEstimate: 120_000,
    chunks: 64,
    extraCharacters: 4,
    extraObjects: 12,
    extraLights: 3,
    vfxBenchmarkId: "family-showcase",
    expected: {
      project: complexity(22, 22, 120_000, 64, 7, 7),
      draftBudgetStatus: "limit",
      vfx: requireVfxExpectation("family-showcase")
    }
  }),
  createScene({
    id: "vfx-fight",
    name: "VFX Fight",
    description: "Forty-eight layered combat explosions with multiple visible actors and props.",
    frame: 4,
    budgetId: "draft",
    sceneObjectEstimate: 20_000,
    chunks: 0,
    extraCharacters: 3,
    extraObjects: 4,
    extraLights: 2,
    vfxBenchmarkId: "dense-balanced",
    expected: {
      project: complexity(12, 12, 20_000, 0, 48, 48),
      draftBudgetStatus: "limit",
      vfx: requireVfxExpectation("dense-balanced")
    }
  }),
  createScene({
    id: "storm",
    name: "Storm Stress Scene",
    description: "Sixty electric storms over sixteen chunks, exercising deterministic VFX dropping.",
    frame: 8,
    budgetId: "draft",
    sceneObjectEstimate: 65_000,
    chunks: 16,
    extraCharacters: 2,
    extraObjects: 0,
    extraLights: 2,
    vfxBenchmarkId: "dense-segments",
    expected: {
      project: complexity(7, 7, 65_000, 16, 60, 48),
      draftBudgetStatus: "limit",
      vfx: requireVfxExpectation("dense-segments")
    }
  })
] satisfies readonly PerformanceBenchmarkScene[]);

export function listPerformanceBenchmarkScenes(): readonly PerformanceBenchmarkScene[] {
  return SCENES;
}

export function getPerformanceBenchmarkScene(
  id: string
): PerformanceBenchmarkScene | null {
  return SCENES.find((scene) => scene.id === id) ?? null;
}

interface SceneDefinition {
  id: PerformanceBenchmarkId;
  name: string;
  description: string;
  frame: number;
  budgetId: PerformanceBudgetId;
  sceneObjectEstimate: number;
  chunks: number;
  extraCharacters: number;
  extraObjects: number;
  extraLights: number;
  vfxBenchmarkId: string | null;
  expected: PerformanceBenchmarkExpectation;
}

function createScene(definition: SceneDefinition): PerformanceBenchmarkScene {
  return Object.freeze({
    version: PERFORMANCE_BENCHMARK_SCENE_VERSION,
    id: definition.id,
    name: definition.name,
    description: definition.description,
    frame: definition.frame,
    budgetId: definition.budgetId,
    sceneObjectEstimate: definition.sceneObjectEstimate,
    expected: Object.freeze({
      project: Object.freeze({ ...definition.expected.project }),
      draftBudgetStatus: definition.expected.draftBudgetStatus,
      vfx: definition.expected.vfx
    }),
    createProject: () => createProject(definition)
  });
}

function createProject(definition: SceneDefinition): MineMotionProject {
  const source = definition.vfxBenchmarkId
    ? getVfxBenchmarkScene(definition.vfxBenchmarkId)?.createProject()
    : createInitialProject(undefined, FIXED_TIME);
  if (!source) throw new Error(`Missing VFX benchmark: ${definition.vfxBenchmarkId}`);

  source.projectName = `Performance Benchmark - ${definition.id}`;
  source.projectSettings.projectName = source.projectName;
  if (!definition.vfxBenchmarkId) source.scene.characters[0].id = "benchmark_primary_character";
  source.metadata.createdAt = FIXED_TIME;
  source.metadata.updatedAt = FIXED_TIME;
  source.animation.currentFrame = definition.frame;
  source.scene.characters.push(
    ...Array.from({ length: definition.extraCharacters }, (_, index) =>
      benchmarkCharacter(index)
    )
  );
  source.scene.importedObjects.push(
    ...Array.from({ length: definition.extraObjects }, (_, index) =>
      benchmarkObject(index)
    )
  );
  if (definition.extraObjects > 0) {
    source.assets.obj.push({
      id: "benchmark_obj_asset",
      name: "Benchmark Cube",
      rawObj: "o Benchmark\\nv 0 0 0\\nv 1 0 0\\nv 0 1 0\\nf 1 2 3\\n",
      importedAt: FIXED_TIME
    });
  }
  source.scene.lights.push(
    ...Array.from({ length: definition.extraLights }, (_, index) =>
      benchmarkLight(index)
    )
  );
  source.world = definition.chunks > 0
    ? {
        sourceName: `Benchmark ${definition.id}`,
        levelDatFound: true,
        dimensions: [],
        importedAt: FIXED_TIME,
        notes: [],
        importedChunks: Array.from(
          { length: definition.chunks },
          (_, index) => benchmarkChunk(index)
        )
      }
    : null;

  return ProjectSerializer.parse(ProjectSerializer.serialize(source));
}

function benchmarkCharacter(index: number): CharacterEntity {
  const character = createCharacter(
    `Benchmark Character ${index + 1}`,
    [index * 2 - 2, 1.05, -2]
  );
  character.id = `benchmark_character_${index}`;
  return character;
}

function benchmarkObject(index: number): ObjEntity {
  const object = createObjEntity(
    "benchmark_obj_asset",
    `Benchmark Prop ${index + 1}`
  );
  object.id = `benchmark_object_${index}`;
  object.transform.position = [index % 6, 0, -Math.floor(index / 6) * 2];
  return object;
}

function benchmarkLight(index: number): LightEntity {
  return {
    id: `benchmark_light_${index}`,
    type: "light",
    name: `Benchmark Light ${index + 1}`,
    visible: true,
    locked: false,
    metadata: {},
    transform: {
      position: [index * 3 - 3, 8, 4],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    },
    intensity: 0.8,
    color: "#dbe8ff"
  };
}

function benchmarkChunk(index: number): ImportedChunkData {
  const chunkX = index % 8;
  const chunkZ = Math.floor(index / 8);
  return {
    id: `overworld:${chunkX},${chunkZ}`,
    dimension: "overworld",
    regionX: Math.floor(chunkX / 32),
    regionZ: Math.floor(chunkZ / 32),
    chunkX,
    chunkZ,
    minY: -64,
    maxY: 320,
    sectionsRead: 1,
    blocks: [],
    unknownBlocks: {},
    warnings: []
  };
}

function complexity(
  sceneEntities: number,
  visibleEntities: number,
  sceneObjects: number,
  importedChunks: number,
  effects: number,
  activeEffects: number
): ProjectComplexityMetrics {
  return {
    sceneEntities,
    visibleEntities,
    sceneObjects,
    importedChunks,
    effects,
    activeEffects
  };
}

function requireVfxExpectation(id: string): VfxBenchmarkSceneExpectation {
  const scene = getVfxBenchmarkScene(id);
  if (!scene) throw new Error(`Missing VFX benchmark expectation: ${id}`);
  return scene.expected;
}
