import type { SceneEntity, Vector3Tuple } from "../../core/scene/SceneTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import { applyWorldEditOperations } from "./WorldEditLayer";
import type { EntityCollisionProfile } from "./MinecraftStudioTypes";

export interface CollisionAabb {
  entityId: string;
  min: Vector3Tuple;
  max: Vector3Tuple;
  layer: number;
  mask: number;
}

export interface CollisionContact {
  id: string;
  kind: "entity-entity" | "entity-world";
  entityAId: string;
  entityBId: string | null;
  penetration: Vector3Tuple;
  normal: Vector3Tuple;
  point: Vector3Tuple;
}

export interface CollisionAnalysis {
  contacts: CollisionContact[];
  testedEntities: number;
  testedPairs: number;
  worldSamples: number;
  warnings: string[];
}

export function setCollisionStudioEnabled(project: MineMotionProject, enabled: boolean): MineMotionProject {
  return withCollisionSettings(project, { enabled });
}

export function setWorldCollisionEnabled(project: MineMotionProject, enabled: boolean): MineMotionProject {
  return withCollisionSettings(project, { worldCollision: enabled });
}

export function setEntityCollisionEnabled(project: MineMotionProject, enabled: boolean): MineMotionProject {
  return withCollisionSettings(project, { entityCollision: enabled });
}

export function setCollisionVisualization(project: MineMotionProject, enabled: boolean): MineMotionProject {
  return withCollisionSettings(project, { visualize: enabled });
}

export function upsertCollisionProfile(
  project: MineMotionProject,
  entityId: string,
  patch: Partial<Omit<EntityCollisionProfile, "entityId">> = {}
): MineMotionProject {
  const entity = findCollidableEntity(project, entityId);
  if (!entity) return project;
  const existing = project.creationSuite.collisions.profiles.find((profile) => profile.entityId === entityId);
  const fallback = createDefaultCollisionProfile(entity);
  const profile: EntityCollisionProfile = {
    ...fallback,
    ...existing,
    ...patch,
    entityId,
    size: sanitizeSize(patch.size ?? existing?.size ?? fallback.size),
    offset: sanitizeVector(patch.offset ?? existing?.offset ?? fallback.offset),
    layer: clampInteger(patch.layer ?? existing?.layer ?? fallback.layer, 0, 31),
    mask: clampInteger(patch.mask ?? existing?.mask ?? fallback.mask, 0, 0x7fffffff)
  };
  const profiles = [
    ...project.creationSuite.collisions.profiles.filter((candidate) => candidate.entityId !== entityId),
    profile
  ];
  return withCollisionSettings(project, { profiles });
}

export function removeCollisionProfile(project: MineMotionProject, entityId: string): MineMotionProject {
  return withCollisionSettings(project, {
    profiles: project.creationSuite.collisions.profiles.filter((profile) => profile.entityId !== entityId)
  });
}

export function createDefaultCollisionProfiles(project: MineMotionProject): MineMotionProject {
  let next = project;
  for (const entity of listCollidableEntities(project)) next = upsertCollisionProfile(next, entity.id);
  return next;
}

export function getCollisionAabb(project: MineMotionProject, entityId: string): CollisionAabb | null {
  const entity = findCollidableEntity(project, entityId);
  if (!entity) return null;
  const profile = project.creationSuite.collisions.profiles.find((candidate) => candidate.entityId === entityId)
    ?? createDefaultCollisionProfile(entity);
  if (!profile.enabled) return null;
  const scale = entity.transform.scale;
  const size: Vector3Tuple = [
    Math.max(0.01, profile.size[0] * Math.abs(scale[0])),
    Math.max(0.01, profile.size[1] * Math.abs(scale[1])),
    Math.max(0.01, profile.size[2] * Math.abs(scale[2]))
  ];
  const center: Vector3Tuple = [
    entity.transform.position[0] + profile.offset[0],
    entity.transform.position[1] + profile.offset[1] + size[1] / 2,
    entity.transform.position[2] + profile.offset[2]
  ];
  return {
    entityId,
    min: [center[0] - size[0] / 2, center[1] - size[1] / 2, center[2] - size[2] / 2],
    max: [center[0] + size[0] / 2, center[1] + size[1] / 2, center[2] + size[2] / 2],
    layer: profile.layer,
    mask: profile.mask
  };
}

export function analyzeCollisions(project: MineMotionProject): CollisionAnalysis {
  const settings = project.creationSuite.collisions;
  if (!settings.enabled) return { contacts: [], testedEntities: 0, testedPairs: 0, worldSamples: 0, warnings: ["Collision Studio is disabled."] };
  const boxes = listCollidableEntities(project)
    .map((entity) => getCollisionAabb(project, entity.id))
    .filter((box): box is CollisionAabb => Boolean(box));
  const contacts: CollisionContact[] = [];
  let testedPairs = 0;
  if (settings.entityCollision) {
    for (let index = 0; index < boxes.length; index += 1) {
      for (let other = index + 1; other < boxes.length; other += 1) {
        const first = boxes[index];
        const second = boxes[other];
        if (!layersInteract(first, second)) continue;
        testedPairs += 1;
        const contact = intersectAabbs(first, second);
        if (contact) contacts.push(contact);
      }
    }
  }
  let worldSamples = 0;
  if (settings.worldCollision && project.world?.importedChunks?.length) {
    const chunks = applyWorldEditOperations(project.world.importedChunks, project.creationSuite.worldEdits).chunks;
    for (const box of boxes) {
      worldSamples += 1;
      const floorY = highestSolidY(chunks, box);
      if (floorY === null) continue;
      const penetrationY = floorY + 1 - box.min[1];
      if (penetrationY > 0.0001) {
        contacts.push({
          id: `world:${box.entityId}:${floorY}`,
          kind: "entity-world",
          entityAId: box.entityId,
          entityBId: null,
          penetration: [0, penetrationY, 0],
          normal: [0, 1, 0],
          point: [(box.min[0] + box.max[0]) / 2, floorY + 1, (box.min[2] + box.max[2]) / 2]
        });
      }
    }
  }
  return {
    contacts,
    testedEntities: boxes.length,
    testedPairs,
    worldSamples,
    warnings: boxes.length === 0 ? ["No collidable entities are present."] : []
  };
}

export function snapEntityToWorld(project: MineMotionProject, entityId: string): MineMotionProject {
  const entity = findCollidableEntity(project, entityId);
  const box = getCollisionAabb(project, entityId);
  if (!entity || !box || !project.world?.importedChunks?.length) return project;
  const chunks = applyWorldEditOperations(project.world.importedChunks, project.creationSuite.worldEdits).chunks;
  const floorY = highestSolidY(chunks, { ...box, min: [box.min[0], -4096, box.min[2]] });
  if (floorY === null) return project;
  const nextY = entity.transform.position[1] + (floorY + 1 - box.min[1]);
  return updateEntityPosition(project, entityId, [entity.transform.position[0], nextY, entity.transform.position[2]]);
}

export function snapAllEntitiesToWorld(project: MineMotionProject): MineMotionProject {
  return listCollidableEntities(project).reduce((next, entity) => snapEntityToWorld(next, entity.id), project);
}

export function resolveEntityCollisions(project: MineMotionProject, iterations = 6): MineMotionProject {
  if (!project.creationSuite.collisions.enabled) return project;
  let next = project;
  for (let pass = 0; pass < clampInteger(iterations, 1, 32); pass += 1) {
    const contacts = analyzeCollisions(next).contacts;
    if (contacts.length === 0) break;
    let changed = false;
    for (const contact of contacts) {
      const entity = findCollidableEntity(next, contact.entityAId);
      if (!entity || entity.locked) continue;
      const delta = contact.kind === "entity-world"
        ? contact.penetration
        : smallestHorizontalResolution(contact.penetration, contact.normal);
      if (delta[0] === 0 && delta[1] === 0 && delta[2] === 0) continue;
      next = updateEntityPosition(next, entity.id, [
        entity.transform.position[0] + delta[0],
        entity.transform.position[1] + delta[1],
        entity.transform.position[2] + delta[2]
      ]);
      changed = true;
    }
    if (!changed) break;
  }
  return next;
}

export function synchronizeCollisionHelpers(project: MineMotionProject): MineMotionProject {
  if (!project.world) return project;
  const markerPrefix = "collision_profile:";
  const retained = (project.world.sceneOverrides?.markers ?? []).filter((marker) => !marker.id.startsWith(markerPrefix));
  const markers = project.creationSuite.collisions.visualize
    ? listCollidableEntities(project).flatMap((entity) => {
        const box = getCollisionAabb(project, entity.id);
        if (!box) return [];
        return [{
          id: `${markerPrefix}${entity.id}`,
          label: `${entity.name} collision`,
          kind: "collision" as const,
          position: [box.min[0], box.min[1], box.min[2]] as Vector3Tuple,
          size: [box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2]] as Vector3Tuple,
          color: "#36d399",
          visible: true
        }];
      })
    : [];
  return {
    ...project,
    world: {
      ...project.world,
      sceneOverrides: {
        hiddenChunkIds: [...(project.world.sceneOverrides?.hiddenChunkIds ?? [])],
        propBlocks: [...(project.world.sceneOverrides?.propBlocks ?? [])],
        markers: [...retained, ...markers]
      }
    },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}

export function exportCollisionManifest(project: MineMotionProject): string {
  return JSON.stringify({
    format: "minemotion-collision-studio-v1",
    enabled: project.creationSuite.collisions.enabled,
    settings: project.creationSuite.collisions,
    analysis: analyzeCollisions(project)
  }, null, 2);
}

function withCollisionSettings(
  project: MineMotionProject,
  patch: Partial<MineMotionProject["creationSuite"]["collisions"]>
): MineMotionProject {
  return {
    ...project,
    creationSuite: {
      ...project.creationSuite,
      collisions: { ...project.creationSuite.collisions, ...patch }
    },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}

function listCollidableEntities(project: MineMotionProject): SceneEntity[] {
  return [...project.scene.characters, ...project.scene.importedObjects].filter((entity) => entity.visible);
}

function findCollidableEntity(project: MineMotionProject, entityId: string): SceneEntity | null {
  return listCollidableEntities(project).find((entity) => entity.id === entityId) ?? null;
}

function createDefaultCollisionProfile(entity: SceneEntity): EntityCollisionProfile {
  const preset = entity.type === "character" && "rigPreset" in entity ? String(entity.rigPreset) : "";
  const quadruped = ["pig", "cow", "wolf"].includes(preset);
  const spider = preset === "spider";
  const creeper = preset === "creeper";
  const size: Vector3Tuple = spider ? [1.4, 0.9, 1.4] : quadruped ? [1.2, 1.3, 1.8] : creeper ? [0.8, 1.7, 0.8] : entity.type === "obj" ? [1, 1, 1] : [0.7, 1.8, 0.7];
  return { entityId: entity.id, enabled: true, shape: "box", size, offset: [0, 0, 0], layer: 0, mask: 0x7fffffff };
}

function layersInteract(first: CollisionAabb, second: CollisionAabb): boolean {
  const firstAccepts = (first.mask & (1 << Math.min(30, second.layer))) !== 0;
  const secondAccepts = (second.mask & (1 << Math.min(30, first.layer))) !== 0;
  return firstAccepts && secondAccepts;
}

function intersectAabbs(first: CollisionAabb, second: CollisionAabb): CollisionContact | null {
  const x = Math.min(first.max[0], second.max[0]) - Math.max(first.min[0], second.min[0]);
  const y = Math.min(first.max[1], second.max[1]) - Math.max(first.min[1], second.min[1]);
  const z = Math.min(first.max[2], second.max[2]) - Math.max(first.min[2], second.min[2]);
  if (x <= 0 || y <= 0 || z <= 0) return null;
  const firstCenter: Vector3Tuple = [(first.min[0] + first.max[0]) / 2, (first.min[1] + first.max[1]) / 2, (first.min[2] + first.max[2]) / 2];
  const secondCenter: Vector3Tuple = [(second.min[0] + second.max[0]) / 2, (second.min[1] + second.max[1]) / 2, (second.min[2] + second.max[2]) / 2];
  const normal: Vector3Tuple = [firstCenter[0] < secondCenter[0] ? -1 : 1, firstCenter[1] < secondCenter[1] ? -1 : 1, firstCenter[2] < secondCenter[2] ? -1 : 1];
  return {
    id: `entity:${first.entityId}:${second.entityId}`,
    kind: "entity-entity",
    entityAId: first.entityId,
    entityBId: second.entityId,
    penetration: [x, y, z],
    normal,
    point: [(Math.max(first.min[0], second.min[0]) + Math.min(first.max[0], second.max[0])) / 2, (Math.max(first.min[1], second.min[1]) + Math.min(first.max[1], second.max[1])) / 2, (Math.max(first.min[2], second.min[2]) + Math.min(first.max[2], second.max[2])) / 2]
  };
}

function smallestHorizontalResolution(penetration: Vector3Tuple, normal: Vector3Tuple): Vector3Tuple {
  if (penetration[0] <= penetration[2]) return [normal[0] * (penetration[0] + 0.001), 0, 0];
  return [0, 0, normal[2] * (penetration[2] + 0.001)];
}

function highestSolidY(chunks: NonNullable<MineMotionProject["world"]>["importedChunks"], box: CollisionAabb): number | null {
  let highest: number | null = null;
  for (const chunk of chunks ?? []) {
    for (const block of chunk.blocks) {
      if (block.id === "air" || block.id === "water" || block.id === "lava") continue;
      if (block.x + 1 <= box.min[0] || block.x >= box.max[0] || block.z + 1 <= box.min[2] || block.z >= box.max[2]) continue;
      if (block.y + 1 > box.max[1] + 4) continue;
      highest = highest === null ? block.y : Math.max(highest, block.y);
    }
  }
  return highest;
}

function updateEntityPosition(project: MineMotionProject, entityId: string, position: Vector3Tuple): MineMotionProject {
  const update = <T extends SceneEntity>(entity: T): T => entity.id === entityId
    ? { ...entity, transform: { ...entity.transform, position: [...position] as Vector3Tuple } }
    : entity;
  return {
    ...project,
    scene: {
      ...project.scene,
      characters: project.scene.characters.map(update),
      importedObjects: project.scene.importedObjects.map(update)
    },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}

function sanitizeSize(value: Vector3Tuple): Vector3Tuple {
  return value.map((part) => Math.max(0.01, Math.min(128, Math.abs(Number.isFinite(part) ? part : 1)))) as Vector3Tuple;
}
function sanitizeVector(value: Vector3Tuple): Vector3Tuple {
  return value.map((part) => Math.max(-4096, Math.min(4096, Number.isFinite(part) ? part : 0))) as Vector3Tuple;
}
function clampInteger(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));
}
