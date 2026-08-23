import type { MineMotionProject } from "../../project/ProjectFile";
import { withWorldSceneOverridesDefaults } from "../staging/WorldSceneOverrides";
import type { MinecraftWorldStudioSettings } from "./MinecraftStudioTypes";
import { createWorldAreaPlan } from "./WorldAreaPlanner";
import { generateBoundedProxyWorld } from "./WorldProxyGenerator";

export interface ConfigureWorldStudioPatch extends Partial<Omit<MinecraftWorldStudioSettings, "area" | "mods" | "lastPlanWarnings">> {
  area?: Partial<MinecraftWorldStudioSettings["area"]>;
}

export interface WorldStudioBuildResult {
  project: MineMotionProject;
  changed: boolean;
  chunksBuilt: number;
  blocksBuilt: number;
  warnings: string[];
}

export function configureWorldStudio(project: MineMotionProject, patch: ConfigureWorldStudioPatch): MineMotionProject {
  const current = project.creationSuite.worldStudio;
  const next: MinecraftWorldStudioSettings = {
    ...current,
    ...patch,
    area: { ...current.area, ...(patch.area ?? {}) },
    mods: current.mods,
    lastPlanWarnings: current.lastPlanWarnings
  };
  const plan = createWorldAreaPlan(next);
  return {
    ...project,
    creationSuite: {
      ...project.creationSuite,
      worldStudio: { ...next, lastPlanWarnings: plan.warnings }
    }
  };
}

export function buildSeedProxyArea(project: MineMotionProject): WorldStudioBuildResult {
  const settings = project.creationSuite.worldStudio;
  if (settings.sourceMode !== "seed-proxy") return { project, changed: false, chunksBuilt: 0, blocksBuilt: 0, warnings: ["World source mode is not seed-proxy."] };
  const generated = generateBoundedProxyWorld(settings);
  const now = new Date().toISOString();
  const importedChunkRange = {
    dimension: settings.area.dimension,
    centerChunkX: settings.area.centerChunkX,
    centerChunkZ: settings.area.centerChunkZ,
    radiusChunks: settings.area.radiusChunks,
    maxChunks: settings.area.maxActiveChunks,
    maxRegionFiles: Math.max(1, Math.ceil(generated.chunks.length / 1024)),
    maxVerticalSections: Math.max(1, Math.ceil((settings.area.maxY - settings.area.minY + 1) / 16))
  };
  const notes = [...generated.warnings, `Seed hash: ${generated.seedHash}`, `Minecraft target: ${settings.minecraftVersion} (${settings.loader})`];
  const next: MineMotionProject = {
    ...project,
    projectSettings: {
      ...project.projectSettings,
      worldSourcePath: `seed:${settings.seed || "0"}`,
      terrainPreset: "none"
    },
    world: {
      sourceName: `Seed proxy ${settings.seed || "0"}`,
      sourcePath: undefined,
      levelDatFound: false,
      levelName: `Studio proxy ${settings.seed || "0"}`,
      spawn: [settings.area.centerChunkX * 16 + 8, 68, settings.area.centerChunkZ * 16 + 8],
      dimensions: [{ id: settings.area.dimension, label: settings.area.dimension, regionFiles: [], estimatedChunks: generated.chunks.length }],
      selectedDimension: settings.area.dimension,
      importedChunkRanges: [importedChunkRange],
      importProfiles: [],
      importedChunks: generated.chunks,
      unknownBlockMappings: {},
      unknownBlockCount: 0,
      importSettings: importedChunkRange,
      performanceEstimate: {
        regionFiles: 0,
        estimatedChunks: generated.chunks.length,
        importedChunks: generated.chunks.length,
        importedBlocks: generated.blockCount,
        visibleBlocks: generated.blockCount,
        estimatedMemoryBytes: generated.blockCount * 32,
        warnings: generated.warnings
      },
      cachedMesh: {
        embedded: true,
        generatedAt: now,
        chunkCount: generated.chunks.length,
        blockCount: generated.blockCount,
        formatVersion: 1,
        fingerprint: generated.seedHash,
        estimatedBytes: generated.blockCount * 32
      },
      renderOptions: { showChunkBorders: true, showWorldOrigin: true },
      sceneOverrides: withWorldSceneOverridesDefaults(project.world?.sceneOverrides),
      sourcePolicy: { access: "read-only", filesystemWritesAllowed: false },
      sourcePathMissing: false,
      importedAt: now,
      notes
    },
    creationSuite: {
      ...project.creationSuite,
      worldStudio: { ...settings, lastPlanWarnings: generated.warnings }
    },
    metadata: { ...project.metadata, updatedAt: now }
  };
  return { project: next, changed: true, chunksBuilt: generated.chunks.length, blocksBuilt: generated.blockCount, warnings: generated.warnings };
}

export function createBlankStudioStage(project: MineMotionProject): WorldStudioBuildResult {
  const settings = project.creationSuite.worldStudio;
  const now = new Date().toISOString();
  const next: MineMotionProject = {
    ...project,
    projectSettings: { ...project.projectSettings, terrainPreset: "flat", worldSourcePath: "" },
    world: {
      sourceName: "Blank Minecraft studio stage",
      levelDatFound: false,
      levelName: "Blank stage",
      dimensions: [{ id: settings.area.dimension, label: settings.area.dimension, regionFiles: [], estimatedChunks: 0 }],
      selectedDimension: settings.area.dimension,
      importedChunkRanges: [],
      importProfiles: [],
      importedChunks: [],
      unknownBlockMappings: {},
      unknownBlockCount: 0,
      renderOptions: { showChunkBorders: true, showWorldOrigin: true },
      sceneOverrides: withWorldSceneOverridesDefaults(project.world?.sceneOverrides),
      sourcePolicy: { access: "read-only", filesystemWritesAllowed: false },
      importedAt: now,
      notes: ["Blank stage created for direct construction in BlockMotion Studio."]
    },
    metadata: { ...project.metadata, updatedAt: now }
  };
  return { project: next, changed: true, chunksBuilt: 0, blocksBuilt: 0, warnings: [] };
}

export function createWorldStudioManifest(project: MineMotionProject): string {
  const settings = project.creationSuite.worldStudio;
  const plan = createWorldAreaPlan(settings);
  return JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceMode: settings.sourceMode,
    seed: settings.seed,
    minecraftVersion: settings.minecraftVersion,
    loader: settings.loader,
    dimension: settings.area.dimension,
    area: settings.area,
    plan: {
      requestedChunks: plan.requestedChunks,
      activeChunks: plan.activeChunks,
      clippedChunks: plan.clippedChunks,
      estimatedMemoryBytes: plan.estimatedMemoryBytes,
      warnings: plan.warnings
    },
    mods: settings.mods.filter((mod) => mod.enabled)
  }, null, 2);
}
