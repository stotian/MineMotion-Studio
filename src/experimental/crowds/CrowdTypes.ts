import type { Vector3Tuple } from "../../project/ProjectFile";
export interface CrowdPrototypeOptions { count: number; radius: number; seed: number; center: Vector3Tuple; spacing: number; }
export interface CrowdPlacement { index: number; position: Vector3Tuple; yawDegrees: number; scale: number; variant: number; }
export interface CrowdPrototypeMetrics { requested: number; generated: number; estimatedSceneObjects: number; estimatedCpuBytes: number; estimatedGpuBytes: number; generationMs: number; densityPerSquareBlock: number; }
export interface CrowdPrototypeResult { placements: CrowdPlacement[]; metrics: CrowdPrototypeMetrics; warnings: string[]; }
