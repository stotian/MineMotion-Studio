import type {
  ActingBeat,
  AttentionCue,
  CombatBeat,
  CombatSequence,
  CustomMobDefinition,
  EntityCatalogEntry,
  EquipmentSet,
  MobLocomotionProfile,
  NarrativeCrowdGroup,
  ParkourNode,
  ParkourPath,
  SecondaryMotionProfile,
  UltraVector3
} from "../UltraTypes";

export interface EntityCatalogResolution {
  requestedId: string;
  resolvedId: string | null;
  usedFallback: boolean;
  compatible: boolean;
  warnings: string[];
}

export interface MobValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  boneCount: number;
  socketCount: number;
}

export interface EquipmentResolution {
  validSlots: EquipmentSet["slots"];
  conflicts: Array<{ slotId: string; assetIds: string[] }>;
}

export interface SecondaryMotionSample {
  positions: UltraVector3[];
  velocities: UltraVector3[];
}

export interface AttentionSample {
  targetPoint: UltraVector3;
  headWeight: number;
  torsoWeight: number;
  priority: number;
}

export interface MobLocomotionSample {
  phase: number;
  strideOffset: number;
  verticalOffset: number;
  bankDegrees: number;
}

export interface CombatValidation {
  valid: boolean;
  beats: CombatBeat[];
  errors: string[];
  warnings: string[];
}

export interface ParkourValidation {
  valid: boolean;
  errors: string[];
  distance: number;
  actions: ParkourNode["action"][];
}

export interface ActingSynchronization {
  emotion: ActingBeat["emotion"];
  intensity: number;
  facialWeight: number;
  bodyWeight: number;
  gazeWeight: number;
  breathingRate: number;
}

export interface CrowdAssignment {
  memberId: string;
  role: NarrativeCrowdGroup["role"];
  leaderId: string | null;
  targetPoint: UltraVector3;
  delayFrames: number;
  lateralOffset: number;
}

export function resolveEntityCatalog(
  entries: readonly EntityCatalogEntry[],
  minecraftId: string,
  dataVersion: number
): EntityCatalogResolution {
  const byId = new Map(entries.filter((entry) => entry.enabled).map((entry) => [entry.minecraftId, entry]));
  const exact = byId.get(minecraftId);
  const warnings: string[] = [];
  if (exact && dataVersion >= exact.minimumDataVersion) {
    return { requestedId: minecraftId, resolvedId: exact.minecraftId, usedFallback: false, compatible: true, warnings };
  }
  if (exact && dataVersion < exact.minimumDataVersion) warnings.push(`${minecraftId} requires data version ${exact.minimumDataVersion}.`);
  let fallbackId: string | null = exact?.fallbackEntityId ?? "minecraft:player";
  const visited = new Set<string>();
  while (fallbackId && !visited.has(fallbackId)) {
    visited.add(fallbackId);
    const fallback = byId.get(fallbackId);
    if (fallback && dataVersion >= fallback.minimumDataVersion) {
      warnings.push(`Using fallback ${fallback.minecraftId}.`);
      return { requestedId: minecraftId, resolvedId: fallback.minecraftId, usedFallback: true, compatible: false, warnings };
    }
    fallbackId = fallback?.fallbackEntityId ?? null;
  }
  warnings.push(`No compatible entity definition for ${minecraftId}.`);
  return { requestedId: minecraftId, resolvedId: null, usedFallback: false, compatible: false, warnings };
}

export function validateCustomMob(definition: CustomMobDefinition): MobValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const boneIds = new Set<string>();
  if (definition.bones.length === 0) errors.push("A custom mob needs at least one bone.");
  if (definition.bones.length > 256) errors.push("A custom mob cannot exceed 256 bones.");
  for (const bone of definition.bones) {
    if (!bone.id || boneIds.has(bone.id)) errors.push(`Duplicate or empty bone id ${bone.id || "<empty>"}.`);
    boneIds.add(bone.id);
    if (bone.parentId && bone.parentId === bone.id) errors.push(`Bone ${bone.id} cannot parent itself.`);
    if (bone.size.some((value) => !Number.isFinite(value) || value <= 0 || value > 128)) errors.push(`Bone ${bone.id} has invalid size.`);
  }
  for (const bone of definition.bones) {
    if (bone.parentId && !boneIds.has(bone.parentId)) errors.push(`Bone ${bone.id} references unknown parent ${bone.parentId}.`);
  }
  if (containsBoneCycle(definition)) errors.push("The custom mob bone hierarchy contains a cycle.");
  const socketIds = new Set<string>();
  for (const socket of definition.sockets) {
    if (!socket.id || socketIds.has(socket.id)) errors.push(`Duplicate or empty socket id ${socket.id || "<empty>"}.`);
    socketIds.add(socket.id);
    if (!boneIds.has(socket.boneId)) errors.push(`Socket ${socket.id} references unknown bone ${socket.boneId}.`);
  }
  if (!definition.textureAssetId) warnings.push("No texture asset is assigned.");
  if (definition.lodDistances.some((distance, index, all) => distance <= 0 || (index > 0 && distance <= all[index - 1]))) {
    errors.push("LOD distances must be strictly increasing positive values.");
  }
  return { valid: errors.length === 0, errors, warnings, boneCount: definition.bones.length, socketCount: definition.sockets.length };
}

export function resolveEquipment(set: EquipmentSet): EquipmentResolution {
  const bySlot = new Map<string, EquipmentSet["slots"]>();
  for (const slot of set.slots) {
    const current = bySlot.get(slot.slotId) ?? [];
    current.push(slot);
    bySlot.set(slot.slotId, current);
  }
  const conflicts = [...bySlot.entries()]
    .filter(([, slots]) => slots.length > 1)
    .map(([slotId, slots]) => ({ slotId, assetIds: slots.map((slot) => slot.assetId) }));
  const validSlots = [...bySlot.entries()]
    .filter(([, slots]) => slots.length === 1)
    .map(([, slots]) => slots[0]);
  return { validSlots, conflicts };
}

export function stepSecondaryMotion(
  profile: SecondaryMotionProfile,
  positions: readonly UltraVector3[],
  velocities: readonly UltraVector3[],
  anchors: readonly UltraVector3[],
  deltaSeconds: number
): SecondaryMotionSample {
  const count = Math.min(profile.chainBoneIds.length, positions.length, velocities.length, anchors.length);
  const dt = clamp(finite(deltaSeconds, 1 / 24), 1 / 240, 1 / 10);
  const stiffness = clamp01(profile.stiffness);
  const damping = clamp01(profile.damping);
  const nextPositions: UltraVector3[] = [];
  const nextVelocities: UltraVector3[] = [];
  for (let index = 0; index < count; index += 1) {
    const position = positions[index];
    const velocity = velocities[index];
    const anchor = anchors[index];
    const spring = scale(subtract(anchor, position), stiffness * 24);
    const gravity = profile.gravity;
    const acceleration = add(spring, gravity);
    const dampedVelocity = scale(add(velocity, scale(acceleration, dt)), Math.max(0, 1 - damping * dt * 12));
    const candidate = add(position, scale(dampedVelocity, dt));
    const maxDistance = Math.max(0.001, profile.collisionRadius * 8);
    const fromAnchor = subtract(candidate, anchor);
    const candidateDistance = length(fromAnchor);
    const constrained = candidateDistance > maxDistance
      ? add(anchor, scale(normalize(fromAnchor), maxDistance))
      : candidate;
    nextPositions.push(canonicalVector(constrained));
    nextVelocities.push(canonicalVector(dampedVelocity));
  }
  return { positions: nextPositions, velocities: nextVelocities };
}

export function resolveAttention(cues: readonly AttentionCue[], characterId: string, frame: number): AttentionSample | null {
  const active = cues
    .filter((cue) => cue.enabled && cue.characterId === characterId && frame >= cue.startFrame && frame <= cue.endFrame)
    .sort((a, b) => b.priority - a.priority || a.startFrame - b.startFrame || a.id.localeCompare(b.id));
  const cue = active[0];
  if (!cue) return null;
  const span = Math.max(1, cue.endFrame - cue.startFrame);
  const edgeBlend = Math.min(clamp01((frame - cue.startFrame) / 4), clamp01((cue.endFrame - frame) / 4), 1);
  return {
    targetPoint: canonicalVector(cue.targetPoint),
    headWeight: canonical(clamp01(cue.headWeight) * edgeBlend),
    torsoWeight: canonical(clamp01(cue.torsoWeight) * edgeBlend),
    priority: cue.priority
  };
}

export function sampleMobLocomotion(profile: MobLocomotionProfile, timeSeconds: number, speed: number): MobLocomotionSample {
  const frequency = Math.max(0.01, finite(profile.gaitFrequency, 1));
  const phase = ((timeSeconds * frequency * Math.PI * 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const normalizedSpeed = clamp01(Math.abs(speed) / Math.max(0.01, profile.strideLength * frequency));
  const familyMultiplier = ({ biped: 1, quadruped: 1.25, flying: 0.75, crawling: 0.6, swimming: 0.8, boss: 0.45 } as const)[profile.family];
  return {
    phase: canonical(phase),
    strideOffset: canonical(Math.sin(phase) * profile.strideLength * normalizedSpeed * familyMultiplier),
    verticalOffset: canonical(Math.abs(Math.sin(phase * (profile.family === "quadruped" ? 2 : 1))) * profile.verticalAmplitude * normalizedSpeed),
    bankDegrees: canonical(profile.family === "flying" || profile.family === "swimming" ? Math.sin(phase) * 8 * normalizedSpeed : 0)
  };
}

export function validateCombatSequence(sequence: CombatSequence): CombatValidation {
  const beats = [...sequence.beats]
    .map((beat) => ({ ...beat, frame: Math.max(0, Math.round(beat.frame)) }))
    .sort((a, b) => a.frame - b.frame || actionOrder(a.action) - actionOrder(b.action) || a.id.localeCompare(b.id));
  const errors: string[] = [];
  const warnings: string[] = [];
  const actorLastContact = new Map<string, number>();
  for (let index = 0; index < beats.length; index += 1) {
    const beat = beats[index];
    if (!beat.actorId || !beat.targetId) errors.push(`Combat beat ${beat.id} needs actor and target ids.`);
    if (beat.actorId === beat.targetId) errors.push(`Combat beat ${beat.id} cannot target its own actor.`);
    if (beat.action === "reaction") {
      const contactFrame = actorLastContact.get(beat.targetId);
      if (contactFrame === undefined) warnings.push(`Reaction ${beat.id} has no earlier contact.`);
      else if (beat.frame - contactFrame < sequence.minimumReactionFrames) errors.push(`Reaction ${beat.id} starts too soon after contact.`);
    }
    if (beat.action === "contact") actorLastContact.set(beat.actorId, beat.frame);
    const previous = beats[index - 1];
    if (previous && previous.frame === beat.frame && previous.actorId === beat.actorId && previous.action === beat.action) {
      warnings.push(`Actor ${beat.actorId} has duplicate ${beat.action} beats at frame ${beat.frame}.`);
    }
  }
  return { valid: errors.length === 0, beats, errors, warnings };
}

export function validateParkourPath(path: ParkourPath): ParkourValidation {
  const errors: string[] = [];
  let totalDistance = 0;
  for (let index = 1; index < path.nodes.length; index += 1) {
    const previous = path.nodes[index - 1];
    const node = path.nodes[index];
    const segmentDistance = distance(previous.position, node.position);
    totalDistance += segmentDistance;
    const vertical = node.position[1] - previous.position[1];
    if ((node.action === "jump" || node.action === "vault" || node.action === "wall-run") && segmentDistance > path.maximumJumpDistance) {
      errors.push(`${node.action} node ${node.id} exceeds the maximum jump distance.`);
    }
    if (node.action === "climb" && vertical > path.maximumClimbHeight) {
      errors.push(`Climb node ${node.id} exceeds the maximum climb height.`);
    }
    if (node.surfaceNormal.some((value) => !Number.isFinite(value))) errors.push(`Node ${node.id} has an invalid surface normal.`);
  }
  return { valid: errors.length === 0, errors, distance: canonical(totalDistance), actions: path.nodes.map((node) => node.action) };
}

export function synchronizeActingBeat(beat: ActingBeat, frame: number): ActingSynchronization | null {
  if (!beat.enabled || frame < beat.startFrame || frame > beat.endFrame) return null;
  const duration = Math.max(1, beat.endFrame - beat.startFrame);
  const local = clamp01((frame - beat.startFrame) / duration);
  const envelope = Math.sin(Math.PI * local);
  const intensity = clamp01(beat.intensity) * (0.35 + envelope * 0.65);
  return {
    emotion: beat.emotion,
    intensity: canonical(intensity),
    facialWeight: canonical(intensity),
    bodyWeight: canonical(intensity * 0.8),
    gazeWeight: canonical(Math.min(1, intensity * 1.1)),
    breathingRate: canonical(clamp(beat.breathingRate, 0, 4) * (1 + intensity * 0.25))
  };
}

export function assignNarrativeCrowd(group: NarrativeCrowdGroup): CrowdAssignment[] {
  const corridorCenter = scale(add(group.actionCorridor[0], group.actionCorridor[1]), 0.5);
  const members = [...new Set(group.memberIds)].sort();
  return members.map((memberId, index) => {
    const random = deterministicUnit(group.seed, index);
    const side = index % 2 === 0 ? -1 : 1;
    const lateralOffset = side * (1.25 + random * 2.75);
    let targetPoint: UltraVector3 = [
      group.focusPoint[0] + lateralOffset,
      group.focusPoint[1],
      group.focusPoint[2] + (random - 0.5) * 4
    ];
    if (pointInsideCorridor(targetPoint, group.actionCorridor)) {
      targetPoint = [corridorCenter[0] + side * 3.5, targetPoint[1], targetPoint[2]];
    }
    return {
      memberId,
      role: group.role,
      leaderId: group.leaderId,
      targetPoint: canonicalVector(targetPoint),
      delayFrames: Math.round(random * 18 + index % 7),
      lateralOffset: canonical(lateralOffset)
    };
  });
}

function containsBoneCycle(definition: CustomMobDefinition): boolean {
  const parentById = new Map(definition.bones.map((bone) => [bone.id, bone.parentId]));
  for (const bone of definition.bones) {
    const visited = new Set<string>();
    let current: string | null | undefined = bone.id;
    while (current) {
      if (visited.has(current)) return true;
      visited.add(current);
      current = parentById.get(current);
    }
  }
  return false;
}

function actionOrder(action: CombatBeat["action"]): number {
  return ({ anticipation: 0, attack: 1, parry: 2, dodge: 2, contact: 3, reaction: 4, recovery: 5 } as const)[action];
}

function pointInsideCorridor(point: UltraVector3, corridor: readonly [UltraVector3, UltraVector3]): boolean {
  const minimum: UltraVector3 = [Math.min(corridor[0][0], corridor[1][0]), Math.min(corridor[0][1], corridor[1][1]), Math.min(corridor[0][2], corridor[1][2])];
  const maximum: UltraVector3 = [Math.max(corridor[0][0], corridor[1][0]), Math.max(corridor[0][1], corridor[1][1]), Math.max(corridor[0][2], corridor[1][2])];
  return point[0] >= minimum[0] && point[0] <= maximum[0] && point[1] >= minimum[1] && point[1] <= maximum[1] && point[2] >= minimum[2] && point[2] <= maximum[2];
}

function deterministicUnit(seed: number, index: number): number {
  let value = (Math.trunc(seed) ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 0x100000000;
}

function add(a: UltraVector3, b: UltraVector3): UltraVector3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function subtract(a: UltraVector3, b: UltraVector3): UltraVector3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function scale(value: UltraVector3, scalar: number): UltraVector3 { return [value[0] * scalar, value[1] * scalar, value[2] * scalar]; }
function length(value: UltraVector3): number { return Math.hypot(value[0], value[1], value[2]); }
function normalize(value: UltraVector3): UltraVector3 { const len = length(value); return len <= 1e-8 ? [0, 0, 0] : scale(value, 1 / len); }
function distance(a: UltraVector3, b: UltraVector3): number { return length(subtract(a, b)); }
function clamp01(value: number): number { return clamp(finite(value), 0, 1); }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)); }
function finite(value: number, fallback = 0): number { return Number.isFinite(value) ? value : fallback; }
function canonical(value: number): number { const finiteValue = finite(value); return Object.is(finiteValue, -0) ? 0 : Number(finiteValue.toFixed(8)); }
function canonicalVector(value: readonly [number, number, number]): UltraVector3 { return [canonical(value[0]), canonical(value[1]), canonical(value[2])]; }
