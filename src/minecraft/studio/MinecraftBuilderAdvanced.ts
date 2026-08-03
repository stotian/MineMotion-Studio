import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import type { WorldEditOperation } from "./MinecraftStudioTypes";
import { addWorldEditOperation } from "./WorldEditLayer";

export const MINECRAFT_STRUCTURE_TEMPLATE_IDS = [
  "wall",
  "floor",
  "hollow-room",
  "watchtower",
  "bridge",
  "road",
  "staircase",
  "dome",
  "castle-gate",
  "village-house",
  "arena",
  "tree-grove"
] as const;
export type MinecraftStructureTemplateId = typeof MINECRAFT_STRUCTURE_TEMPLATE_IDS[number];

export interface AdvancedBuildOptions {
  width?: number;
  height?: number;
  depth?: number;
  blockName?: string;
  accentBlockName?: string;
  hollow?: boolean;
  facing?: "north" | "south" | "east" | "west";
}

export interface AdvancedBuildResult {
  project: MineMotionProject;
  changed: boolean;
  operationIds: string[];
  estimatedBlocks: number;
  warnings: string[];
}

export interface BlueprintImportResult extends AdvancedBuildResult {
  blueprintName: string;
}

interface BuildOperationSeed {
  name: string;
  kind?: "set" | "erase" | "fill" | "replace" | "clone";
  from: Vector3Tuple;
  to?: Vector3Tuple;
  destination?: Vector3Tuple;
  blockName?: string;
  matchBlockName?: string;
}

export function createMinecraftStructure(
  project: MineMotionProject,
  templateId: MinecraftStructureTemplateId,
  origin: Vector3Tuple,
  options: AdvancedBuildOptions = {}
): AdvancedBuildResult {
  const width = clampInt(options.width ?? defaultSize(templateId)[0], 1, 64);
  const height = clampInt(options.height ?? defaultSize(templateId)[1], 1, 64);
  const depth = clampInt(options.depth ?? defaultSize(templateId)[2], 1, 64);
  const block = safeBlock(options.blockName, "minecraft:stone_bricks");
  const accent = safeBlock(options.accentBlockName, "minecraft:oak_planks");
  const at = integerVector(origin);
  const seeds = structureSeeds(templateId, at, width, height, depth, block, accent, options.facing ?? "north");
  return appendSeeds(project, seeds);
}

export function createLineBrush(
  project: MineMotionProject,
  from: Vector3Tuple,
  to: Vector3Tuple,
  blockName = "minecraft:stone"
): AdvancedBuildResult {
  const start = integerVector(from);
  const end = integerVector(to);
  const steps = Math.min(256, Math.max(Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1]), Math.abs(end[2] - start[2])) + 1);
  const seen = new Set<string>();
  const seeds: BuildOperationSeed[] = [];
  for (let index = 0; index < steps; index += 1) {
    const t = steps <= 1 ? 0 : index / (steps - 1);
    const point = [
      Math.round(start[0] + (end[0] - start[0]) * t),
      Math.round(start[1] + (end[1] - start[1]) * t),
      Math.round(start[2] + (end[2] - start[2]) * t)
    ] as Vector3Tuple;
    const key = point.join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    seeds.push({ name: `Line brush ${seeds.length + 1}`, kind: "set", from: point, blockName: safeBlock(blockName, "minecraft:stone") });
  }
  return appendSeeds(project, seeds);
}

export function createSphereBrush(
  project: MineMotionProject,
  center: Vector3Tuple,
  radius: number,
  blockName = "minecraft:stone",
  hollow = false
): AdvancedBuildResult {
  const r = clampInt(radius, 1, 10);
  const c = integerVector(center);
  const seeds: BuildOperationSeed[] = [];
  for (let y = -r; y <= r; y += 1) {
    for (let z = -r; z <= r; z += 1) {
      const horizontalSquared = r * r - y * y - z * z;
      if (horizontalSquared < 0) continue;
      const x = Math.floor(Math.sqrt(horizontalSquared));
      if (hollow) {
        seeds.push({ name: "Sphere shell left", kind: "set", from: [c[0] - x, c[1] + y, c[2] + z], blockName });
        if (x > 0) seeds.push({ name: "Sphere shell right", kind: "set", from: [c[0] + x, c[1] + y, c[2] + z], blockName });
      } else {
        seeds.push({ name: "Sphere row", kind: "fill", from: [c[0] - x, c[1] + y, c[2] + z], to: [c[0] + x, c[1] + y, c[2] + z], blockName });
      }
    }
  }
  return appendSeeds(project, seeds.slice(0, 500));
}

export function createCylinderBrush(
  project: MineMotionProject,
  center: Vector3Tuple,
  radius: number,
  height: number,
  blockName = "minecraft:stone",
  hollow = false
): AdvancedBuildResult {
  const r = clampInt(radius, 1, 12);
  const h = clampInt(height, 1, 64);
  const c = integerVector(center);
  const seeds: BuildOperationSeed[] = [];
  for (let z = -r; z <= r; z += 1) {
    const width = Math.floor(Math.sqrt(Math.max(0, r * r - z * z)));
    if (hollow) {
      seeds.push({ name: "Cylinder left", kind: "fill", from: [c[0] - width, c[1], c[2] + z], to: [c[0] - width, c[1] + h - 1, c[2] + z], blockName });
      if (width > 0) seeds.push({ name: "Cylinder right", kind: "fill", from: [c[0] + width, c[1], c[2] + z], to: [c[0] + width, c[1] + h - 1, c[2] + z], blockName });
    } else {
      seeds.push({ name: "Cylinder slice", kind: "fill", from: [c[0] - width, c[1], c[2] + z], to: [c[0] + width, c[1] + h - 1, c[2] + z], blockName });
    }
  }
  return appendSeeds(project, seeds);
}

export function mirrorWorldEditLayer(
  project: MineMotionProject,
  axis: "x" | "z",
  pivot: number
): AdvancedBuildResult {
  const index = axis === "x" ? 0 : 2;
  const available = Math.max(0, 512 - project.creationSuite.worldEdits.length);
  const source = project.creationSuite.worldEdits.filter((entry) => entry.enabled).slice(0, available);
  const seeds = source.map((operation) => {
    const reflect = (value: Vector3Tuple): Vector3Tuple => value.map((entry, current) => current === index ? Math.round(pivot * 2 - entry) : entry) as Vector3Tuple;
    return {
      name: `${operation.name} mirrored ${axis.toUpperCase()}`,
      kind: operation.kind,
      from: reflect(operation.from),
      to: reflect(operation.to),
      destination: operation.destination ? reflect(operation.destination) : undefined,
      blockName: operation.blockName,
      matchBlockName: operation.matchBlockName
    } satisfies BuildOperationSeed;
  });
  return appendSeeds(project, seeds);
}

export function duplicateWorldEditLayer(
  project: MineMotionProject,
  offset: Vector3Tuple
): AdvancedBuildResult {
  const delta = integerVector(offset);
  const available = Math.max(0, 512 - project.creationSuite.worldEdits.length);
  const seeds = project.creationSuite.worldEdits.filter((entry) => entry.enabled).slice(0, available).map((operation) => {
    const move = (value: Vector3Tuple): Vector3Tuple => [value[0] + delta[0], value[1] + delta[1], value[2] + delta[2]];
    return { ...operation, id: undefined, name: `${operation.name} copy`, from: move(operation.from), to: move(operation.to), destination: operation.destination ? move(operation.destination) : undefined } as BuildOperationSeed;
  });
  return appendSeeds(project, seeds);
}

export function exportWorldEditBlueprint(project: MineMotionProject, name = "MineMotion Blueprint"): string {
  const enabled = project.creationSuite.worldEdits.filter((entry) => entry.enabled);
  const origin = blueprintOrigin(enabled);
  return JSON.stringify({
    schemaVersion: 1,
    name: name.trim().slice(0, 120) || "MineMotion Blueprint",
    createdAt: new Date().toISOString(),
    origin,
    operations: enabled.map((operation) => ({
      ...operation,
      id: undefined,
      createdAt: undefined,
      from: subtract(operation.from, origin),
      to: subtract(operation.to, origin),
      destination: operation.destination ? subtract(operation.destination, origin) : undefined
    }))
  }, null, 2);
}

export function importWorldEditBlueprint(
  project: MineMotionProject,
  raw: string,
  destination: Vector3Tuple
): BlueprintImportResult {
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.operations)) throw new Error("Unsupported MineMotion blueprint.");
  const base = integerVector(destination);
  const seeds = parsed.operations.slice(0, 512).flatMap((entry, index) => {
    if (!isRecord(entry) || !isVector(entry.from) || !isVector(entry.to)) return [];
    const kind = ["set", "erase", "fill", "replace", "clone"].includes(String(entry.kind)) ? String(entry.kind) as BuildOperationSeed["kind"] : "fill";
    const add = (value: Vector3Tuple): Vector3Tuple => [value[0] + base[0], value[1] + base[1], value[2] + base[2]];
    return [{
      name: typeof entry.name === "string" ? entry.name.slice(0, 120) : `Blueprint operation ${index + 1}`,
      kind,
      from: add(entry.from),
      to: add(entry.to),
      destination: isVector(entry.destination) ? add(entry.destination) : undefined,
      blockName: typeof entry.blockName === "string" ? entry.blockName : undefined,
      matchBlockName: typeof entry.matchBlockName === "string" ? entry.matchBlockName : undefined
    } satisfies BuildOperationSeed];
  });
  const result = appendSeeds(project, seeds);
  return { ...result, blueprintName: typeof parsed.name === "string" ? parsed.name.slice(0, 120) : "Imported blueprint" };
}

export function analyzeWorldEditSelection(project: MineMotionProject): { operations: number; estimatedBlocks: number; bounds: { min: Vector3Tuple; max: Vector3Tuple } | null; warnings: string[] } {
  const operations = project.creationSuite.worldEdits.filter((entry) => entry.enabled);
  if (operations.length === 0) return { operations: 0, estimatedBlocks: 0, bounds: null, warnings: [] };
  const min: Vector3Tuple = [Infinity, Infinity, Infinity];
  const max: Vector3Tuple = [-Infinity, -Infinity, -Infinity];
  let estimatedBlocks = 0;
  for (const operation of operations) {
    for (let index = 0; index < 3; index += 1) {
      min[index] = Math.min(min[index], operation.from[index], operation.to[index]);
      max[index] = Math.max(max[index], operation.from[index], operation.to[index]);
    }
    estimatedBlocks += operationVolume(operation);
  }
  const warnings: string[] = [];
  if (operations.length > 400) warnings.push("The builder layer is close to its 512-operation safety limit.");
  if (estimatedBlocks > 500_000) warnings.push("This blueprint is large; bake in sections or lower the active chunk budget.");
  return { operations: operations.length, estimatedBlocks, bounds: { min, max }, warnings };
}

function structureSeeds(template: MinecraftStructureTemplateId, [x, y, z]: Vector3Tuple, width: number, height: number, depth: number, block: string, accent: string, facing: NonNullable<AdvancedBuildOptions["facing"]>): BuildOperationSeed[] {
  const x2 = x + width - 1, y2 = y + height - 1, z2 = z + depth - 1;
  const fill = (name: string, from: Vector3Tuple, to: Vector3Tuple, blockName = block): BuildOperationSeed => ({ name, kind: "fill", from, to, blockName });
  if (template === "wall") return [fill("Wall", [x, y, z], [x2, y2, z])];
  if (template === "floor") return [fill("Floor", [x, y, z], [x2, y, z2])];
  if (template === "hollow-room") return hollowBoxSeeds("Room", [x, y, z], [x2, y2, z2], block);
  if (template === "watchtower") return [...hollowBoxSeeds("Tower", [x, y, z], [x2, y2, z2], block), fill("Tower roof", [x - 1, y2, z - 1], [x2 + 1, y2, z2 + 1], accent), fill("Tower door", [x + Math.floor(width / 2), y, z], [x + Math.floor(width / 2), y + 2, z], "minecraft:air")];
  if (template === "bridge") return [fill("Bridge deck", [x, y, z], [x2, y, z2], accent), fill("Bridge rail left", [x, y + 1, z], [x2, y + 2, z], block), fill("Bridge rail right", [x, y + 1, z2], [x2, y + 2, z2], block)];
  if (template === "road") return [fill("Road", [x, y, z], [x2, y, z2], block), fill("Road edge left", [x, y + 1, z], [x2, y + 1, z], accent), fill("Road edge right", [x, y + 1, z2], [x2, y + 1, z2], accent)];
  if (template === "staircase") return Array.from({ length: Math.min(height, 32) }, (_, index) => fill(`Stair ${index + 1}`, [x, y + index, z + index], [x2, y + index, z + index], block));
  if (template === "dome") return sphereShellSeeds([x + Math.floor(width / 2), y, z + Math.floor(depth / 2)], Math.max(2, Math.floor(Math.min(width, depth) / 2)), block, true);
  if (template === "castle-gate") return [fill("Gate left tower", [x, y, z], [x + 2, y2, z2], block), fill("Gate right tower", [x2 - 2, y, z], [x2, y2, z2], block), fill("Gate arch", [x + 3, y2 - 2, z], [x2 - 3, y2, z2], block), fill("Gate bars", [x + 3, y, z + Math.floor(depth / 2)], [x2 - 3, y2 - 3, z + Math.floor(depth / 2)], "minecraft:iron_bars")];
  if (template === "village-house") return [...hollowBoxSeeds("House", [x, y, z], [x2, y + Math.max(3, height - 2), z2], accent), fill("House roof", [x - 1, y2 - 1, z - 1], [x2 + 1, y2, z2 + 1], block), fill("House door", [x + Math.floor(width / 2), y, z], [x + Math.floor(width / 2), y + 1, z], "minecraft:air")];
  if (template === "arena") return [...hollowBoxSeeds("Arena wall", [x, y, z], [x2, y + Math.min(4, height), z2], block), fill("Arena floor", [x + 1, y, z + 1], [x2 - 1, y, z2 - 1], accent)];
  const seeds: BuildOperationSeed[] = [];
  for (let dz = 0; dz < depth; dz += 4) for (let dx = 0; dx < width; dx += 4) {
    seeds.push(fill("Tree trunk", [x + dx, y, z + dz], [x + dx, y + Math.max(2, height - 2), z + dz], "minecraft:oak_log"));
    seeds.push(fill("Tree canopy", [x + dx - 1, y + Math.max(2, height - 3), z + dz - 1], [x + dx + 1, y2, z + dz + 1], "minecraft:oak_leaves"));
  }
  return rotateSeeds(seeds, [x, y, z], facing);
}

function hollowBoxSeeds(name: string, min: Vector3Tuple, max: Vector3Tuple, blockName: string): BuildOperationSeed[] {
  return [
    { name: `${name} floor`, kind: "fill", from: min, to: [max[0], min[1], max[2]], blockName },
    { name: `${name} ceiling`, kind: "fill", from: [min[0], max[1], min[2]], to: max, blockName },
    { name: `${name} north`, kind: "fill", from: min, to: [max[0], max[1], min[2]], blockName },
    { name: `${name} south`, kind: "fill", from: [min[0], min[1], max[2]], to: max, blockName },
    { name: `${name} west`, kind: "fill", from: min, to: [min[0], max[1], max[2]], blockName },
    { name: `${name} east`, kind: "fill", from: [max[0], min[1], min[2]], to: max, blockName }
  ];
}

function sphereShellSeeds(center: Vector3Tuple, radius: number, blockName: string, upperHalf = false): BuildOperationSeed[] {
  const seeds: BuildOperationSeed[] = [];
  for (let y = upperHalf ? 0 : -radius; y <= radius; y += 1) for (let z = -radius; z <= radius; z += 1) {
    const squared = radius * radius - y * y - z * z;
    if (squared < 0) continue;
    const x = Math.floor(Math.sqrt(squared));
    seeds.push({ name: "Dome shell", kind: "set", from: [center[0] - x, center[1] + y, center[2] + z], blockName });
    if (x > 0) seeds.push({ name: "Dome shell", kind: "set", from: [center[0] + x, center[1] + y, center[2] + z], blockName });
  }
  return seeds.slice(0, 500);
}

function rotateSeeds(seeds: BuildOperationSeed[], origin: Vector3Tuple, facing: NonNullable<AdvancedBuildOptions["facing"]>): BuildOperationSeed[] {
  if (facing === "north") return seeds;
  const rotations = facing === "east" ? 1 : facing === "south" ? 2 : 3;
  const rotate = (point: Vector3Tuple): Vector3Tuple => {
    let x = point[0] - origin[0], z = point[2] - origin[2];
    for (let index = 0; index < rotations; index += 1) [x, z] = [-z, x];
    return [origin[0] + x, point[1], origin[2] + z];
  };
  return seeds.map((seed) => ({ ...seed, from: rotate(seed.from), to: seed.to ? rotate(seed.to) : undefined, destination: seed.destination ? rotate(seed.destination) : undefined }));
}

function appendSeeds(project: MineMotionProject, seeds: BuildOperationSeed[]): AdvancedBuildResult {
  let next = project;
  const beforeIds = new Set(project.creationSuite.worldEdits.map((entry) => entry.id));
  const warnings: string[] = [];
  for (const seed of seeds) {
    const updated = addWorldEditOperation(next, { ...seed, kind: seed.kind ?? "fill" });
    if (updated === next) { warnings.push("The builder stopped at the 512-operation safety limit."); break; }
    next = updated;
  }
  const added = next.creationSuite.worldEdits.filter((entry) => !beforeIds.has(entry.id));
  return { project: next, changed: added.length > 0, operationIds: added.map((entry) => entry.id), estimatedBlocks: added.reduce((sum, entry) => sum + operationVolume(entry), 0), warnings: [...new Set(warnings)] };
}

function operationVolume(operation: Pick<WorldEditOperation, "from" | "to">): number {
  return (Math.abs(operation.to[0] - operation.from[0]) + 1) * (Math.abs(operation.to[1] - operation.from[1]) + 1) * (Math.abs(operation.to[2] - operation.from[2]) + 1);
}
function blueprintOrigin(operations: WorldEditOperation[]): Vector3Tuple {
  if (operations.length === 0) return [0, 0, 0];
  return [0, 1, 2].map((index) => Math.min(...operations.flatMap((entry) => [entry.from[index], entry.to[index]]))) as Vector3Tuple;
}
function subtract(value: Vector3Tuple, origin: Vector3Tuple): Vector3Tuple { return [value[0] - origin[0], value[1] - origin[1], value[2] - origin[2]]; }
function defaultSize(template: MinecraftStructureTemplateId): Vector3Tuple {
  if (template === "wall") return [12, 5, 1];
  if (template === "floor" || template === "road") return [12, 1, 5];
  if (template === "watchtower") return [7, 12, 7];
  if (template === "bridge") return [16, 3, 5];
  if (template === "staircase") return [5, 8, 8];
  if (template === "dome") return [13, 7, 13];
  if (template === "castle-gate") return [15, 10, 5];
  if (template === "village-house") return [9, 7, 7];
  if (template === "arena") return [21, 6, 21];
  if (template === "tree-grove") return [16, 7, 16];
  return [9, 6, 9];
}
function safeBlock(value: string | undefined, fallback: string): string { const trimmed = value?.trim(); return trimmed && /^[a-z0-9_.-]+:[a-z0-9_./-]+$/i.test(trimmed) ? trimmed : fallback; }
function integerVector(value: Vector3Tuple): Vector3Tuple { return value.map((entry) => Math.round(Number.isFinite(entry) ? entry : 0)) as Vector3Tuple; }
function clampInt(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : min))); }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function isVector(value: unknown): value is Vector3Tuple { return Array.isArray(value) && value.length === 3 && value.every((entry) => typeof entry === "number" && Number.isFinite(entry)); }
