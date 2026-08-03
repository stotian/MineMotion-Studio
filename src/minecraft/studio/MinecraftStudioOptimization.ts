import type { MineMotionProject } from "../../project/ProjectFile";
import { optimizeVoxelModel } from "./VoxelModeling";
import { createWorldAreaPlan } from "./WorldAreaPlanner";

export const STUDIO_PERFORMANCE_TARGETS = ["low-end", "balanced", "cinematic"] as const;
export type StudioPerformanceTarget = (typeof STUDIO_PERFORMANCE_TARGETS)[number];

export interface MinecraftStudioBudget {
  target: StudioPerformanceTarget;
  maxChunks: number;
  maxBlocks: number;
  maxVoxelCubes: number;
  maxCharacters: number;
  maxLights: number;
  maxEffects: number;
  maxAnimationKeyframes: number;
  targetFps: number;
}

export interface MinecraftStudioOptimizationReport {
  score: number;
  level: "good" | "warning" | "critical";
  metrics: {
    chunks: number;
    blocks: number;
    voxelCubes: number;
    characters: number;
    lights: number;
    effects: number;
    animationKeyframes: number;
    worldEditOperations: number;
    estimatedWorldBytes: number;
  };
  budget: MinecraftStudioBudget;
  warnings: string[];
  recommendations: string[];
}

export const STUDIO_PERFORMANCE_BUDGETS: Readonly<Record<StudioPerformanceTarget, MinecraftStudioBudget>> = {
  "low-end": { target: "low-end", maxChunks: 49, maxBlocks: 180_000, maxVoxelCubes: 1_500, maxCharacters: 24, maxLights: 8, maxEffects: 120, maxAnimationKeyframes: 12_000, targetFps: 30 },
  balanced: { target: "balanced", maxChunks: 169, maxBlocks: 650_000, maxVoxelCubes: 6_000, maxCharacters: 64, maxLights: 24, maxEffects: 500, maxAnimationKeyframes: 60_000, targetFps: 60 },
  cinematic: { target: "cinematic", maxChunks: 441, maxBlocks: 2_000_000, maxVoxelCubes: 20_000, maxCharacters: 160, maxLights: 64, maxEffects: 1_500, maxAnimationKeyframes: 220_000, targetFps: 60 }
};

export function analyzeMinecraftStudioPerformance(project: MineMotionProject, target: StudioPerformanceTarget = "balanced"): MinecraftStudioOptimizationReport {
  const budget = STUDIO_PERFORMANCE_BUDGETS[target];
  const chunks = project.world?.importedChunks?.length ?? 0;
  const blocks = project.world?.importedChunks?.reduce((sum, chunk) => sum + chunk.blocks.length, 0) ?? 0;
  const voxelCubes = project.creationSuite.models.reduce((sum, model) => sum + model.cubes.length, 0);
  const animationKeyframes = project.animation.tracks.reduce((sum, track) => sum + track.keyframes.length, 0);
  const metrics = {
    chunks,
    blocks,
    voxelCubes,
    characters: project.scene.characters.length,
    lights: project.scene.lights.length,
    effects: project.effects.instances.length,
    animationKeyframes,
    worldEditOperations: project.creationSuite.worldEdits.length,
    estimatedWorldBytes: blocks * 40 + chunks * 1024
  };
  const warnings: string[] = [];
  const recommendations: string[] = [];
  evaluate("chunks", chunks, budget.maxChunks, warnings, recommendations, "Reduce the active chunk radius or max active chunks.");
  evaluate("blocks", blocks, budget.maxBlocks, warnings, recommendations, "Use medium/far proxy LOD or import a tighter selection.");
  evaluate("voxel cubes", voxelCubes, budget.maxVoxelCubes, warnings, recommendations, "Run model cube deduplication and split distant props into reusable assets.");
  evaluate("characters", metrics.characters, budget.maxCharacters, warnings, recommendations, "Hide background actors outside their shots or divide crowds into takes.");
  evaluate("lights", metrics.lights, budget.maxLights, warnings, recommendations, "Keep only key lights enabled for preview and use emissive blocks for background light.");
  evaluate("effects", metrics.effects, budget.maxEffects, warnings, recommendations, "Disable or remove off-camera VFX and use draft preview quality.");
  evaluate("animation keyframes", animationKeyframes, budget.maxAnimationKeyframes, warnings, recommendations, "Simplify dense tracks or reuse NLA clips across rig groups.");
  if (metrics.worldEditOperations > 256) recommendations.push("Bake stable world-edit layers and keep active edits for creative changes only.");
  const pressure = [
    chunks / budget.maxChunks,
    blocks / budget.maxBlocks,
    voxelCubes / budget.maxVoxelCubes,
    metrics.characters / budget.maxCharacters,
    metrics.lights / budget.maxLights,
    metrics.effects / budget.maxEffects,
    animationKeyframes / budget.maxAnimationKeyframes
  ];
  const peak = Math.max(0, ...pressure);
  const average = pressure.reduce((sum, value) => sum + Math.min(2, value), 0) / pressure.length;
  const score = Math.max(0, Math.min(100, Math.round(100 - peak * 24 - average * 18)));
  return { score, level: peak > 1.4 ? "critical" : peak > 0.85 ? "warning" : "good", metrics, budget, warnings, recommendations: [...new Set(recommendations)] };
}

export function applyMinecraftStudioPerformanceTarget(project: MineMotionProject, target: StudioPerformanceTarget): MineMotionProject {
  const budget = STUDIO_PERFORMANCE_BUDGETS[target];
  const maxRadius = Math.max(1, Math.floor((Math.sqrt(budget.maxChunks) - 1) / 2));
  const currentArea = project.creationSuite.worldStudio.area;
  const radiusChunks = Math.min(currentArea.radiusChunks, maxRadius);
  const area = {
    ...currentArea,
    radiusChunks,
    maxActiveChunks: Math.min(budget.maxChunks, (radiusChunks * 2 + 1) ** 2),
    nearLodRadius: Math.min(currentArea.nearLodRadius, target === "low-end" ? 1 : target === "balanced" ? 2 : 4),
    mediumLodRadius: Math.min(radiusChunks, target === "low-end" ? 3 : target === "balanced" ? 6 : 10),
    unloadDistanceChunks: Math.max(radiusChunks + 2, Math.min(currentArea.unloadDistanceChunks, radiusChunks + (target === "low-end" ? 3 : 6)))
  };
  const plan = createWorldAreaPlan({ ...project.creationSuite.worldStudio, area });
  const allowedChunkIds = new Set(plan.chunks.map((chunk) => `${area.dimension}:${chunk.chunkX}:${chunk.chunkZ}`));
  const importedChunks = project.world?.importedChunks?.filter((chunk) => chunk.dimension !== area.dimension || allowedChunkIds.has(`${chunk.dimension}:${chunk.chunkX}:${chunk.chunkZ}`));
  return {
    ...project,
    creationSuite: { ...project.creationSuite, worldStudio: { ...project.creationSuite.worldStudio, area, lastPlanWarnings: plan.warnings } },
    world: project.world ? {
      ...project.world,
      importedChunks,
      performanceEstimate: project.world.performanceEstimate ? {
        ...project.world.performanceEstimate,
        importedChunks: importedChunks?.length ?? 0,
        importedBlocks: importedChunks?.reduce((sum, chunk) => sum + chunk.blocks.length, 0) ?? 0,
        visibleBlocks: importedChunks?.reduce((sum, chunk) => sum + chunk.blocks.length, 0) ?? 0
      } : project.world.performanceEstimate
    } : project.world,
    performanceSettings: {
      ...project.performanceSettings,
      targetFps: budget.targetFps,
      renderQualityDuringPlayback: target === "cinematic" ? "balanced" : "draft",
      cacheStaticTerrain: true
    },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}

export function optimizeAllVoxelModels(project: MineMotionProject): MineMotionProject {
  return project.creationSuite.models.reduce((next, model) => optimizeVoxelModel(next, model.id).project, project);
}

export function disableOffAreaEffects(project: MineMotionProject): MineMotionProject {
  const area = project.creationSuite.worldStudio.area;
  const centerX = area.centerChunkX * 16 + 8;
  const centerZ = area.centerChunkZ * 16 + 8;
  const radius = (area.radiusChunks + 1) * 16;
  const instances = project.effects.instances.map((effect) => {
    const dx = effect.position[0] - centerX;
    const dz = effect.position[2] - centerZ;
    return Math.hypot(dx, dz) > radius ? { ...effect, enabled: false } : effect;
  });
  return { ...project, effects: { ...project.effects, instances }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } };
}

export function autoOptimizeMinecraftStudio(project: MineMotionProject, target: StudioPerformanceTarget = "balanced"): MineMotionProject {
  let next = applyMinecraftStudioPerformanceTarget(project, target);
  next = optimizeAllVoxelModels(next);
  next = disableOffAreaEffects(next);
  return next;
}

export function exportOptimizationReport(project: MineMotionProject, target: StudioPerformanceTarget = "balanced"): string {
  return JSON.stringify({ format: "minemotion-studio-performance-v1", generatedAt: new Date().toISOString(), ...analyzeMinecraftStudioPerformance(project, target) }, null, 2);
}

function evaluate(label: string, value: number, limit: number, warnings: string[], recommendations: string[], recommendation: string): void {
  if (value > limit) { warnings.push(`${label}: ${value.toLocaleString()} exceeds ${limit.toLocaleString()}.`); recommendations.push(recommendation); }
  else if (value > limit * 0.8) { warnings.push(`${label}: ${value.toLocaleString()} is close to the ${limit.toLocaleString()} budget.`); recommendations.push(recommendation); }
}
