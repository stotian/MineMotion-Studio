import type { MineMotionProject } from "../project/ProjectFile";
import type { RenderStats } from "./RenderStats";
import type { RendererCullingSummary } from "../renderer/RendererCulling";

export interface RendererFrameInfo {
  calls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  programs: number;
}

export interface BrowserHeapMetrics {
  usedBytes: number;
  totalBytes: number;
  limitBytes: number;
}

export interface ProjectComplexityMetrics {
  sceneEntities: number;
  visibleEntities: number;
  sceneObjects: number;
  importedChunks: number;
  effects: number;
  activeEffects: number;
}

export interface RendererMetricsSnapshot {
  startupMs: number;
  elapsedMs: number;
  frame: RenderStats;
  renderer: RendererFrameInfo;
  heap: BrowserHeapMetrics | null;
  project: ProjectComplexityMetrics;
  culling: RendererCullingSummary;
}

export function collectProjectComplexityMetrics(
  project: MineMotionProject,
  sceneObjects: number,
  activeEffects: number
): ProjectComplexityMetrics {
  const entities = [
    ...project.scene.characters,
    ...project.scene.cameras,
    ...project.scene.importedObjects,
    ...project.scene.lights
  ];
  return {
    sceneEntities: entities.length,
    visibleEntities: entities.filter((entry) => entry.visible).length,
    sceneObjects: safeCount(sceneObjects),
    importedChunks: Math.min(
      1_000_000,
      project.world?.importedChunks?.length ?? 0
    ),
    effects: Math.min(4_096, project.effects.instances.length),
    activeEffects: Math.min(
      project.effects.instances.length,
      safeCount(activeEffects)
    )
  };
}

export function readBrowserHeapMetrics(value: unknown): BrowserHeapMetrics | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const usedBytes = finiteBytes(source.usedJSHeapSize);
  const totalBytes = finiteBytes(source.totalJSHeapSize);
  const limitBytes = finiteBytes(source.jsHeapSizeLimit);
  if (usedBytes === null || totalBytes === null || limitBytes === null) {
    return null;
  }
  return {
    usedBytes: Math.min(usedBytes, totalBytes),
    totalBytes: Math.min(totalBytes, limitBytes),
    limitBytes
  };
}

export function sanitizeRendererFrameInfo(
  value: Partial<RendererFrameInfo>
): RendererFrameInfo {
  return {
    calls: safeCount(value.calls),
    triangles: safeCount(value.triangles),
    points: safeCount(value.points),
    lines: safeCount(value.lines),
    geometries: safeCount(value.geometries),
    textures: safeCount(value.textures),
    programs: safeCount(value.programs)
  };
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)))
    : 0;
}

function finiteBytes(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value))
    : null;
}
