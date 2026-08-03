import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { mapMinecraftBlockName } from "../import/BlockStateDecoder";
import type { ImportedChunkData, MinecraftBlockSample } from "../import/MinecraftChunkTypes";
import type { WorldEditOperation, WorldEditOperationKind } from "./MinecraftStudioTypes";

const MAX_OPERATIONS = 512;
const MAX_VOLUME_PER_OPERATION = 65_536;

export interface WorldEditApplicationResult {
  chunks: ImportedChunkData[];
  appliedOperations: number;
  changedBlocks: number;
  skippedOperations: number;
  warnings: string[];
}

export interface AddWorldEditRequest {
  kind: WorldEditOperationKind;
  name?: string;
  from: Vector3Tuple;
  to?: Vector3Tuple;
  destination?: Vector3Tuple;
  blockName?: string;
  matchBlockName?: string;
}

export function addWorldEditOperation(project: MineMotionProject, request: AddWorldEditRequest): MineMotionProject {
  if (project.creationSuite.worldEdits.length >= MAX_OPERATIONS) return project;
  const operation: WorldEditOperation = {
    id: nextId(project.creationSuite.worldEdits),
    name: request.name?.trim().slice(0, 120) || title(request.kind),
    kind: request.kind,
    enabled: true,
    from: integerVector(request.from),
    to: integerVector(request.to ?? request.from),
    destination: request.destination ? integerVector(request.destination) : undefined,
    blockName: request.blockName?.trim().slice(0, 180),
    matchBlockName: request.matchBlockName?.trim().slice(0, 180),
    createdAt: new Date().toISOString()
  };
  return {
    ...project,
    creationSuite: {
      ...project.creationSuite,
      worldEdits: [...project.creationSuite.worldEdits, operation]
    }
  };
}

export function updateWorldEditOperation(project: MineMotionProject, operationId: string, patch: Partial<WorldEditOperation>): MineMotionProject {
  if (!project.creationSuite.worldEdits.some((operation) => operation.id === operationId)) return project;
  return {
    ...project,
    creationSuite: {
      ...project.creationSuite,
      worldEdits: project.creationSuite.worldEdits.map((operation) => operation.id === operationId ? {
        ...operation,
        ...patch,
        id: operation.id,
        from: patch.from ? integerVector(patch.from) : operation.from,
        to: patch.to ? integerVector(patch.to) : operation.to,
        destination: patch.destination ? integerVector(patch.destination) : patch.destination === undefined ? operation.destination : undefined
      } : operation)
    }
  };
}

export function removeWorldEditOperation(project: MineMotionProject, operationId: string): MineMotionProject {
  return {
    ...project,
    creationSuite: {
      ...project.creationSuite,
      worldEdits: project.creationSuite.worldEdits.filter((operation) => operation.id !== operationId)
    }
  };
}

export function clearWorldEditOperations(project: MineMotionProject): MineMotionProject {
  return project.creationSuite.worldEdits.length === 0 ? project : {
    ...project,
    creationSuite: { ...project.creationSuite, worldEdits: [] }
  };
}

export function applyWorldEditOperations(chunks: readonly ImportedChunkData[], operations: readonly WorldEditOperation[]): WorldEditApplicationResult {
  if (chunks.length === 0 || operations.length === 0) return { chunks: [...chunks], appliedOperations: 0, changedBlocks: 0, skippedOperations: 0, warnings: [] };
  const active = operations.filter((operation) => operation.enabled).slice(0, MAX_OPERATIONS);
  const warnings: string[] = [];
  const mutable = new Map(chunks.map((chunk) => [chunk.id, cloneChunk(chunk)]));
  const chunksByCoord = new Map<string, ImportedChunkData>();
  for (const chunk of mutable.values()) chunksByCoord.set(chunkKey(chunk.dimension, chunk.chunkX, chunk.chunkZ), chunk);
  let appliedOperations = 0;
  let skippedOperations = 0;
  let changedBlocks = 0;

  for (const operation of active) {
    const bounds = normalizeBounds(operation.from, operation.to);
    const volume = (bounds.max[0] - bounds.min[0] + 1) * (bounds.max[1] - bounds.min[1] + 1) * (bounds.max[2] - bounds.min[2] + 1);
    if (volume > MAX_VOLUME_PER_OPERATION) {
      skippedOperations += 1;
      warnings.push(`${operation.name} skipped: ${volume} blocks exceeds ${MAX_VOLUME_PER_OPERATION}.`);
      continue;
    }
    const before = changedBlocks;
    if (operation.kind === "clone") {
      changedBlocks += cloneBounds(chunksByCoord, chunks[0].dimension, bounds, operation.destination ?? operation.to);
    } else {
      changedBlocks += mutateBounds(chunksByCoord, chunks[0].dimension, bounds, operation);
    }
    if (changedBlocks > before) appliedOperations += 1;
  }

  const output = chunks.map((chunk) => mutable.get(chunk.id) ?? chunk);
  return { chunks: output, appliedOperations, changedBlocks, skippedOperations, warnings };
}

export function bakeWorldEdits(project: MineMotionProject): MineMotionProject {
  if (!project.world?.importedChunks?.length || project.creationSuite.worldEdits.length === 0) return project;
  const applied = applyWorldEditOperations(project.world.importedChunks, project.creationSuite.worldEdits);
  return {
    ...project,
    world: {
      ...project.world,
      importedChunks: applied.chunks,
      notes: [...project.world.notes.filter((note) => !note.startsWith("World edits baked:")), `World edits baked: ${applied.changedBlocks} changed blocks across ${applied.appliedOperations} operations.`]
    },
    creationSuite: { ...project.creationSuite, worldEdits: [] },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}

export function createWorldEditManifest(project: MineMotionProject): string {
  return JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), operations: project.creationSuite.worldEdits }, null, 2);
}

function mutateBounds(chunks: Map<string, ImportedChunkData>, dimension: string, bounds: Bounds, operation: WorldEditOperation): number {
  let changed = 0;
  forEachCoordinate(bounds, (x, y, z) => {
    const chunk = chunks.get(chunkKey(dimension, Math.floor(x / 16), Math.floor(z / 16)));
    if (!chunk) return;
    const index = findBlockIndex(chunk.blocks, x, y, z);
    const existing = index >= 0 ? chunk.blocks[index] : null;
    if (operation.kind === "erase") {
      if (index >= 0) { chunk.blocks.splice(index, 1); changed += 1; }
      return;
    }
    if (operation.kind === "replace") {
      if (!existing || !matches(existing, operation.matchBlockName)) return;
      const replacement = createBlock(operation.blockName ?? "minecraft:stone", x, y, z);
      chunk.blocks[index] = replacement;
      changed += 1;
      return;
    }
    if (operation.kind === "set" || operation.kind === "fill") {
      const replacement = createBlock(operation.blockName ?? "minecraft:stone", x, y, z);
      if (index >= 0) chunk.blocks[index] = replacement;
      else chunk.blocks.push(replacement);
      changed += 1;
    }
  });
  return changed;
}

function cloneBounds(chunks: Map<string, ImportedChunkData>, dimension: string, bounds: Bounds, destination: Vector3Tuple): number {
  const source: MinecraftBlockSample[] = [];
  forEachCoordinate(bounds, (x, y, z) => {
    const chunk = chunks.get(chunkKey(dimension, Math.floor(x / 16), Math.floor(z / 16)));
    if (!chunk) return;
    const block = chunk.blocks.find((candidate) => candidate.x === x && candidate.y === y && candidate.z === z);
    if (block) source.push(block);
  });
  const offset: Vector3Tuple = [Math.round(destination[0]) - bounds.min[0], Math.round(destination[1]) - bounds.min[1], Math.round(destination[2]) - bounds.min[2]];
  let changed = 0;
  for (const block of source) {
    const x = block.x + offset[0];
    const y = block.y + offset[1];
    const z = block.z + offset[2];
    const chunk = chunks.get(chunkKey(dimension, Math.floor(x / 16), Math.floor(z / 16)));
    if (!chunk) continue;
    const index = findBlockIndex(chunk.blocks, x, y, z);
    const next = { ...block, x, y, z };
    if (index >= 0) chunk.blocks[index] = next;
    else chunk.blocks.push(next);
    changed += 1;
  }
  return changed;
}

function createBlock(name: string, x: number, y: number, z: number): MinecraftBlockSample {
  const minecraftName = name.includes(":") ? name : `minecraft:${name}`;
  return { id: mapMinecraftBlockName(minecraftName), minecraftName, stateKey: minecraftName, x, y, z };
}
function matches(block: MinecraftBlockSample, match: string | undefined): boolean {
  if (!match) return true;
  const normalized = match.includes(":") ? match : `minecraft:${match}`;
  return block.minecraftName === normalized || block.stateKey === normalized || block.id === match;
}
function findBlockIndex(blocks: readonly MinecraftBlockSample[], x: number, y: number, z: number): number {
  return blocks.findIndex((block) => block.x === x && block.y === y && block.z === z);
}
function cloneChunk(chunk: ImportedChunkData): ImportedChunkData {
  return { ...chunk, blocks: chunk.blocks.map((block) => ({ ...block, properties: block.properties ? { ...block.properties } : undefined })), warnings: [...chunk.warnings], unknownBlocks: { ...chunk.unknownBlocks } };
}
interface Bounds { min: Vector3Tuple; max: Vector3Tuple; }
function normalizeBounds(from: Vector3Tuple, to: Vector3Tuple): Bounds {
  return { min: [Math.min(from[0], to[0]), Math.min(from[1], to[1]), Math.min(from[2], to[2])].map(Math.round) as Vector3Tuple, max: [Math.max(from[0], to[0]), Math.max(from[1], to[1]), Math.max(from[2], to[2])].map(Math.round) as Vector3Tuple };
}
function forEachCoordinate(bounds: Bounds, visitor: (x: number, y: number, z: number) => void): void {
  for (let y = bounds.min[1]; y <= bounds.max[1]; y += 1) for (let z = bounds.min[2]; z <= bounds.max[2]; z += 1) for (let x = bounds.min[0]; x <= bounds.max[0]; x += 1) visitor(x, y, z);
}
function integerVector(value: Vector3Tuple): Vector3Tuple { return value.map((part) => Math.round(Number.isFinite(part) ? part : 0)) as Vector3Tuple; }
function nextId(operations: readonly WorldEditOperation[]): string { let index = operations.length + 1; const ids = new Set(operations.map((operation) => operation.id)); while (ids.has(`world_edit_${index}`)) index += 1; return `world_edit_${index}`; }
function title(kind: WorldEditOperationKind): string { return `${kind.slice(0, 1).toUpperCase()}${kind.slice(1)} blocks`; }
function chunkKey(dimension: string, x: number, z: number): string { return `${dimension}:${x}:${z}`; }
