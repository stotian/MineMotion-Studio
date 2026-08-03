import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import type { ImportedChunkData } from "../import/MinecraftChunkTypes";
import { createWorldAreaPlan } from "./WorldAreaPlanner";

export type WorldChunkLodTier = "near" | "medium" | "far";

export interface StreamedWorldChunk {
  chunk: ImportedChunkData;
  distanceChunks: number;
  lod: WorldChunkLodTier;
  priority: number;
}

export interface WorldStreamingReport {
  sourceChunks: number;
  selectedChunks: number;
  omittedChunks: number;
  selectedBlocks: number;
  renderedBlocks: number;
  reductionRatio: number;
  centerChunk: [number, number];
  lodCounts: Record<WorldChunkLodTier, number>;
  warnings: string[];
}

function worldToChunk(value: number): number {
  return Math.floor(value / 16);
}

function resolveCenter(project: MineMotionProject, focus?: Vector3Tuple): [number, number] {
  if (focus) return [worldToChunk(focus[0]), worldToChunk(focus[2])];
  const camera = project.scene.cameras.find((entry) => entry.id === project.activeCameraId)
    ?? project.scene.cameras[0];
  if (camera) return [worldToChunk(camera.transform.position[0]), worldToChunk(camera.transform.position[2])];
  const area = project.creationSuite.worldStudio.area;
  return [area.centerChunkX, area.centerChunkZ];
}

export function classifyWorldChunkLod(
  distanceChunks: number,
  nearRadius: number,
  mediumRadius: number
): WorldChunkLodTier {
  if (distanceChunks <= nearRadius) return "near";
  if (distanceChunks <= mediumRadius) return "medium";
  return "far";
}

export function selectStreamedWorldChunks(
  project: MineMotionProject,
  focus?: Vector3Tuple
): StreamedWorldChunk[] {
  const chunks = project.world?.importedChunks ?? [];
  if (chunks.length === 0) return [];
  const area = project.creationSuite.worldStudio.area;
  const [centerX, centerZ] = resolveCenter(project, focus);
  const planned = createWorldAreaPlan({
    ...project.creationSuite.worldStudio,
    area: {
      ...area,
      centerChunkX: centerX,
      centerChunkZ: centerZ
    }
  });
  const allowed = new Map(planned.chunks.map((entry) => [`${entry.chunkX}:${entry.chunkZ}`, entry]));
  return chunks
    .filter((chunk) => chunk.dimension === area.dimension)
    .flatMap((chunk) => {
      const plan = allowed.get(`${chunk.chunkX}:${chunk.chunkZ}`);
      if (!plan) return [];
      const distanceChunks = Math.hypot(chunk.chunkX - centerX, chunk.chunkZ - centerZ);
      return [{
        chunk,
        distanceChunks,
        lod: classifyWorldChunkLod(distanceChunks, area.nearLodRadius, area.mediumLodRadius),
        priority: plan.priority
      } satisfies StreamedWorldChunk];
    })
    .sort((left, right) => left.priority - right.priority || left.distanceChunks - right.distanceChunks)
    .slice(0, area.maxActiveChunks);
}

export function getStreamedChunksForRender(
  project: MineMotionProject,
  focus?: Vector3Tuple
): ImportedChunkData[] {
  if (!(project.world?.importedChunks?.length)) return [];
  return selectStreamedWorldChunks(project, focus).map((entry) => simplifyChunkForLod(entry.chunk, entry.lod));
}

export function simplifyChunkForLod(chunk: ImportedChunkData, lod: WorldChunkLodTier): ImportedChunkData {
  if (lod === "near" || chunk.blocks.length < 256) return chunk;
  const topByColumn = new Map<string, typeof chunk.blocks[number]>();
  const detail: typeof chunk.blocks = [];
  for (const block of chunk.blocks) {
    const localX = ((block.x % 16) + 16) % 16;
    const localZ = ((block.z % 16) + 16) % 16;
    if (lod === "far" && (localX % 2 !== 0 || localZ % 2 !== 0)) continue;
    const key = `${block.x}:${block.z}`;
    const current = topByColumn.get(key);
    if (!current || block.y > current.y) topByColumn.set(key, block);
    if (lod === "medium" && isDetailBlock(block.minecraftName)) detail.push(block);
  }
  const selected = [...new Map([...topByColumn.values(), ...detail].map((block) => [`${block.x}:${block.y}:${block.z}`, block])).values()];
  return {
    ...chunk,
    blocks: selected,
    status: `streamed-${lod}`,
    warnings: [...chunk.warnings, `MineMotion ${lod} LOD reduced ${chunk.blocks.length} blocks to ${selected.length} render samples.`]
  };
}

export function estimateWorldStreamingReduction(project: MineMotionProject, focus?: Vector3Tuple): { sourceBlocks: number; renderedBlocks: number; reductionRatio: number } {
  const selected = selectStreamedWorldChunks(project, focus);
  const sourceBlocks = selected.reduce((total, entry) => total + entry.chunk.blocks.length, 0);
  const renderedBlocks = selected.reduce((total, entry) => total + simplifyChunkForLod(entry.chunk, entry.lod).blocks.length, 0);
  return { sourceBlocks, renderedBlocks, reductionRatio: sourceBlocks <= 0 ? 0 : 1 - renderedBlocks / sourceBlocks };
}

function isDetailBlock(name: string): boolean {
  return /(water|lava|glass|torch|lantern|fire|portal|chest|sign|flower|rail|redstone)/i.test(name);
}

export function analyzeWorldStreaming(
  project: MineMotionProject,
  focus?: Vector3Tuple
): WorldStreamingReport {
  const source = project.world?.importedChunks ?? [];
  const selected = selectStreamedWorldChunks(project, focus);
  const [centerX, centerZ] = resolveCenter(project, focus);
  const lodCounts: Record<WorldChunkLodTier, number> = { near: 0, medium: 0, far: 0 };
  for (const entry of selected) lodCounts[entry.lod] += 1;
  const warnings: string[] = [];
  if (source.length > 0 && selected.length === 0) warnings.push("No imported chunks intersect the active bounded area.");
  if (source.length > selected.length) warnings.push(`${source.length - selected.length} chunks remain unloaded outside the active area.`);
  if (selected.some((entry) => entry.lod === "far" && entry.chunk.blocks.length > 100_000)) warnings.push("Dense far chunks should use cached or simplified geometry during playback.");
  const reduction = estimateWorldStreamingReduction(project, focus);
  return {
    sourceChunks: source.length,
    selectedChunks: selected.length,
    omittedChunks: Math.max(0, source.length - selected.length),
    selectedBlocks: reduction.sourceBlocks,
    renderedBlocks: reduction.renderedBlocks,
    reductionRatio: reduction.reductionRatio,
    centerChunk: [centerX, centerZ],
    lodCounts,
    warnings
  };
}

export function exportWorldStreamingManifest(project: MineMotionProject, focus?: Vector3Tuple): string {
  const selected = selectStreamedWorldChunks(project, focus);
  return JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    area: project.creationSuite.worldStudio.area,
    report: analyzeWorldStreaming(project, focus),
    chunks: selected.map((entry) => ({
      id: entry.chunk.id,
      dimension: entry.chunk.dimension,
      chunkX: entry.chunk.chunkX,
      chunkZ: entry.chunk.chunkZ,
      lod: entry.lod,
      priority: entry.priority,
      blocks: entry.chunk.blocks.length
    }))
  }, null, 2);
}
