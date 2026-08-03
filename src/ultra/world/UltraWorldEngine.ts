import type {
  BattleScenario,
  BattleWave,
  CombustionSource,
  DebrisProfile,
  DestructionEvent,
  FluidVolume,
  RedstoneGraph,
  RedstoneNode,
  RigidBodyRecord,
  SetLayer,
  SetLayerOperation,
  UltraVector3,
  VehicleRecord,
  WeatherSeasonPreset
} from "../UltraTypes";

export interface SetBlockState {
  x: number;
  y: number;
  z: number;
  blockState: string | null;
  hidden: boolean;
  sourceLayerId: string;
}

export interface DestructionSample {
  blockPosition: UltraVector3;
  activationFrame: number;
  impulse: UltraVector3;
}

export interface DebrisPiece {
  id: string;
  sourceBlock: UltraVector3;
  position: UltraVector3;
  velocity: UltraVector3;
  dust: boolean;
  visibleUntilDistance: number;
}

export interface RigidBodyStep {
  position: UltraVector3;
  velocity: UltraVector3;
  angularVelocity: UltraVector3;
  sleeping: boolean;
}

export interface FluidSurfaceSample {
  position: UltraVector3;
  normal: UltraVector3;
  heightOffset: number;
  flow: UltraVector3;
  emissive: number;
}

export interface CombustionSample {
  active: boolean;
  flameIntensity: number;
  smokeDensity: number;
  lightIntensity: number;
  spreadRadius: number;
}

export interface RedstoneEvaluation {
  frame: number;
  powers: Record<string, number>;
  activatedNodeIds: string[];
  warnings: string[];
}

export interface VehicleSample {
  position: UltraVector3;
  forward: UltraVector3;
  up: UltraVector3;
  bankDegrees: number;
  passengerPositions: UltraVector3[];
}

export interface WeatherSample {
  rain: number;
  snow: number;
  storm: number;
  fog: number;
  wind: number;
  accumulation: number;
  colorTemperatureKelvin: number;
}

export interface BattleEvent {
  frame: number;
  waveId: string;
  kind: "activate-group" | "projectile" | "destruction" | "weather";
  targetId: string;
  sequence: number;
}

export interface BattleSchedule {
  valid: boolean;
  events: BattleEvent[];
  peakActiveEntities: number;
  peakEventsPerFrame: number;
  errors: string[];
}

export function applySetLayers(layers: readonly SetLayer[]): SetBlockState[] {
  const stateByPosition = new Map<string, SetBlockState>();
  for (const layer of layers.filter((candidate) => candidate.enabled)) {
    for (const operation of layer.operations) {
      const key = positionKey(operation);
      const previous = stateByPosition.get(key);
      switch (operation.operation) {
        case "add":
        case "replace":
          stateByPosition.set(key, {
            x: Math.round(operation.x), y: Math.round(operation.y), z: Math.round(operation.z),
            blockState: operation.blockState ?? "minecraft:air",
            hidden: false,
            sourceLayerId: layer.id
          });
          break;
        case "hide":
          stateByPosition.set(key, {
            x: Math.round(operation.x), y: Math.round(operation.y), z: Math.round(operation.z),
            blockState: previous?.blockState ?? null,
            hidden: true,
            sourceLayerId: layer.id
          });
          break;
      }
    }
  }
  return [...stateByPosition.values()].sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
}

export function scheduleDestruction(event: DestructionEvent): DestructionSample[] {
  const radius = Math.max(0.001, finite(event.radius, 1));
  const propagation = Math.max(1, Math.round(event.propagationFrames));
  return [...event.blockPositions]
    .filter(isFiniteVector)
    .map((position, index) => {
      const offset = subtract(position, event.origin);
      const normalizedDistance = clamp01(length(offset) / radius);
      const random = deterministicUnit(event.seed, index);
      const direction = length(offset) <= 1e-8 ? randomDirection(event.seed, index) : normalize(offset);
      const impulseMagnitude = (1 - normalizedDistance * 0.65) * (2 + random * 4);
      return {
        blockPosition: canonicalVector(position),
        activationFrame: Math.max(0, Math.round(event.startFrame + normalizedDistance * propagation + random * 2)),
        impulse: canonicalVector(add(scale(direction, impulseMagnitude), [0, 1.25 + random * 2, 0]))
      };
    })
    .sort((a, b) => a.activationFrame - b.activationFrame || positionKey(a.blockPosition).localeCompare(positionKey(b.blockPosition)));
}

export function generateDebris(
  event: DestructionEvent,
  profile: DebrisProfile
): DebrisPiece[] {
  const destruction = scheduleDestruction(event);
  const maximum = Math.max(0, Math.min(100_000, Math.round(profile.maximumPieces)));
  const pieces: DebrisPiece[] = [];
  for (let index = 0; index < destruction.length && pieces.length < maximum; index += 1) {
    const sample = destruction[index];
    const solidPieces = Math.max(0, Math.round(profile.piecesPerBlock));
    const dustPieces = Math.max(0, Math.round(profile.dustPerBlock));
    for (let piece = 0; piece < solidPieces + dustPieces && pieces.length < maximum; piece += 1) {
      const random = deterministicUnit(event.seed + index * 17, piece);
      const dust = piece >= solidPieces;
      pieces.push({
        id: `${event.id}_${index}_${piece}`,
        sourceBlock: sample.blockPosition,
        position: canonicalVector(add(sample.blockPosition, [random - 0.5, 0.25 + random * 0.5, deterministicUnit(event.seed + piece, index) - 0.5])),
        velocity: canonicalVector(scale(add(sample.impulse, randomDirection(event.seed + index, piece)), dust ? 0.35 : 0.75)),
        dust,
        visibleUntilDistance: Math.max(1, finite(profile.visibilityDistance, 96))
      });
    }
  }
  return pieces;
}

export function stepRigidBody(body: RigidBodyRecord, deltaSeconds: number, gravity: UltraVector3 = [0, -9.81, 0]): RigidBodyStep {
  if (body.sleeping) return {
    position: canonicalVector(body.position),
    velocity: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    sleeping: true
  };
  const dt = clamp(finite(deltaSeconds, 1 / 24), 1 / 1000, 1 / 10);
  const friction = clamp01(body.friction);
  const restitution = clamp01(body.restitution);
  let velocity = add(body.velocity, scale(gravity, dt));
  let position = add(body.position, scale(velocity, dt));
  if (position[1] < 0) {
    position = [position[0], 0, position[2]];
    velocity = [velocity[0] * (1 - friction), Math.abs(velocity[1]) * restitution, velocity[2] * (1 - friction)];
  }
  const angularVelocity = scale(body.angularVelocity, Math.max(0, 1 - friction * dt));
  const sleeping = length(velocity) < 0.015 && length(angularVelocity) < 0.015 && position[1] <= 1e-8;
  return {
    position: canonicalVector(position),
    velocity: sleeping ? [0, 0, 0] : canonicalVector(velocity),
    angularVelocity: sleeping ? [0, 0, 0] : canonicalVector(angularVelocity),
    sleeping
  };
}

export function sampleStylizedFluid(volume: FluidVolume, position: UltraVector3, timeSeconds: number): FluidSurfaceSample {
  const size = Math.max(0.125, finite(volume.surfaceBlockSize, 1));
  const flowDirection = normalize(volume.flowDirection);
  const flowSpeed = Math.max(0, finite(volume.flowSpeed, 0.5));
  const localX = (position[0] - volume.boundsMin[0]) / size;
  const localZ = (position[2] - volume.boundsMin[2]) / size;
  const phase = (localX * 0.73 + localZ * 0.41 + timeSeconds * flowSpeed) * Math.PI * 2;
  const amplitude = volume.kind === "lava" ? 0.06 : 0.035;
  const heightOffset = Math.sin(phase) * amplitude + Math.sin(phase * 0.37) * amplitude * 0.45;
  const normal = normalize([-Math.cos(phase) * amplitude, 1, -Math.sin(phase * 0.83) * amplitude]);
  return {
    position: canonicalVector([snap(position[0], size), volume.boundsMax[1] + heightOffset, snap(position[2], size)]),
    normal: canonicalVector(normal),
    heightOffset: canonical(heightOffset),
    flow: canonicalVector(scale(flowDirection, flowSpeed)),
    emissive: volume.kind === "lava" ? 1 : 0
  };
}

export function sampleCombustion(source: CombustionSource, frame: number): CombustionSample {
  const start = Math.max(0, Math.round(source.ignitionFrame));
  const duration = Math.max(1, Math.round(source.durationFrames));
  if (!source.enabled || frame < start || frame > start + duration || source.fuel <= 0) {
    return { active: false, flameIntensity: 0, smokeDensity: 0, lightIntensity: 0, spreadRadius: 0 };
  }
  const progress = clamp01((frame - start) / duration);
  const ignition = clamp01(progress / 0.1);
  const decay = clamp01((1 - progress) / 0.2);
  const flicker = 0.82 + deterministicUnit(source.seed, Math.round(frame)) * 0.18;
  const flameIntensity = clamp01(source.fuel) * Math.min(ignition, decay) * flicker;
  return {
    active: true,
    flameIntensity: canonical(flameIntensity),
    smokeDensity: canonical(clamp01(source.smokeDensity) * (0.35 + progress * 0.65)),
    lightIntensity: canonical(flameIntensity * 2.4),
    spreadRadius: canonical(Math.max(0, source.spreadRadius) * Math.sqrt(progress))
  };
}

export function evaluateRedstoneGraph(graph: RedstoneGraph, frame: number): RedstoneEvaluation {
  const nodes = [...graph.nodes].sort((a, b) => a.delayFrames - b.delayFrames || a.id.localeCompare(b.id));
  const powers: Record<string, number> = {};
  const warnings: string[] = [];
  const overrideByNode = new Map<string, number>();
  for (const override of [...graph.timelineOverrides].sort((a, b) => a.frame - b.frame)) {
    if (override.frame <= frame) overrideByNode.set(override.nodeId, clamp(Math.round(override.power), 0, 15));
  }
  for (let pass = 0; pass < Math.max(1, nodes.length); pass += 1) {
    let changed = false;
    for (const node of nodes) {
      const override = overrideByNode.get(node.id);
      const next = override ?? computeNodePower(node, powers, frame);
      if (powers[node.id] !== next) {
        powers[node.id] = next;
        changed = true;
      }
    }
    if (!changed) break;
    if (pass === nodes.length - 1 && changed) warnings.push("Redstone graph did not fully converge; check for unbounded feedback.");
  }
  return {
    frame: Math.round(frame),
    powers,
    activatedNodeIds: Object.entries(powers).filter(([, power]) => power > 0).map(([id]) => id).sort(),
    warnings
  };
}

export function sampleVehicle(vehicle: VehicleRecord, progress: number, passengerCount = vehicle.passengerIds.length): VehicleSample {
  const t = clamp01(progress);
  const position = samplePolyline(vehicle.path.length > 0 ? vehicle.path : [[0, 0, 0]], t);
  const ahead = samplePolyline(vehicle.path.length > 0 ? vehicle.path : [[0, 0, 0]], Math.min(1, t + 0.002));
  const forward = normalize(subtract(ahead, position));
  const horizontalForward = length([forward[0], 0, forward[2]]) <= 1e-8 ? [0, 0, 1] as UltraVector3 : normalize([forward[0], 0, forward[2]]);
  const up: UltraVector3 = [0, 1, 0];
  const bankDegrees = canonical((vehicle.kind === "elytra" || vehicle.kind === "boat" ? vehicle.banking : vehicle.banking * 0.35) * 30 * Math.sin(t * Math.PI));
  const passengerPositions = Array.from({ length: Math.max(0, Math.min(32, passengerCount)) }, (_, index) => {
    const row = Math.floor(index / 2);
    const side = index % 2 === 0 ? -1 : 1;
    const right: UltraVector3 = [horizontalForward[2], 0, -horizontalForward[0]];
    return canonicalVector(add(position, add(scale(right, side * 0.35), scale(horizontalForward, -0.45 - row * 0.55))));
  });
  return { position: canonicalVector(position), forward: canonicalVector(forward), up, bankDegrees, passengerPositions };
}

export function sampleWeather(a: WeatherSeasonPreset, b: WeatherSeasonPreset | null, progress: number): WeatherSample {
  const t = b ? smoothstep(clamp01(progress)) : 0;
  const target = b ?? a;
  return {
    rain: canonical(lerp(clamp01(a.rain), clamp01(target.rain), t)),
    snow: canonical(lerp(clamp01(a.snow), clamp01(target.snow), t)),
    storm: canonical(lerp(clamp01(a.storm), clamp01(target.storm), t)),
    fog: canonical(lerp(clamp01(a.fog), clamp01(target.fog), t)),
    wind: canonical(lerp(clamp01(a.wind), clamp01(target.wind), t)),
    accumulation: canonical(lerp(clamp01(a.accumulation), clamp01(target.accumulation), t)),
    colorTemperatureKelvin: canonical(lerp(clamp(a.colorTemperatureKelvin, 1000, 20000), clamp(target.colorTemperatureKelvin, 1000, 20000), t))
  };
}

export function scheduleBattle(scenario: BattleScenario): BattleSchedule {
  const events: BattleEvent[] = [];
  const errors: string[] = [];
  let sequence = 0;
  let peakActiveEntities = 0;
  const activeGroups = new Set<string>();
  for (const wave of [...scenario.waves].sort((a, b) => a.startFrame - b.startFrame || a.id.localeCompare(b.id))) {
    const frame = Math.max(0, Math.round(wave.startFrame));
    for (const groupId of [...new Set(wave.groupIds)].sort()) {
      activeGroups.add(groupId);
      events.push({ frame, waveId: wave.id, kind: "activate-group", targetId: groupId, sequence: sequence++ });
    }
    peakActiveEntities = Math.max(peakActiveEntities, activeGroups.size * 25);
    for (let projectile = 0; projectile < Math.max(0, Math.min(100_000, Math.round(wave.projectileCount))); projectile += 1) {
      const spread = Math.round(deterministicUnit(scenario.seed + frame, projectile) * Math.max(1, scenario.fps));
      events.push({ frame: frame + spread, waveId: wave.id, kind: "projectile", targetId: `projectile_${projectile}`, sequence: sequence++ });
    }
    for (const destructionId of [...new Set(wave.destructionEventIds)].sort()) {
      events.push({ frame, waveId: wave.id, kind: "destruction", targetId: destructionId, sequence: sequence++ });
    }
    if (wave.weatherPresetId) events.push({ frame, waveId: wave.id, kind: "weather", targetId: wave.weatherPresetId, sequence: sequence++ });
  }
  events.sort((a, b) => a.frame - b.frame || a.sequence - b.sequence);
  const perFrame = new Map<number, number>();
  for (const event of events) perFrame.set(event.frame, (perFrame.get(event.frame) ?? 0) + 1);
  const peakEventsPerFrame = Math.max(0, ...perFrame.values());
  if (peakActiveEntities > scenario.maximumActiveEntities) errors.push(`Battle exceeds maximum active entities: ${peakActiveEntities}/${scenario.maximumActiveEntities}.`);
  if (peakEventsPerFrame > scenario.maximumEventsPerFrame) errors.push(`Battle exceeds maximum events per frame: ${peakEventsPerFrame}/${scenario.maximumEventsPerFrame}.`);
  return { valid: errors.length === 0, events, peakActiveEntities, peakEventsPerFrame, errors };
}

function computeNodePower(node: RedstoneNode, powers: Readonly<Record<string, number>>, frame: number): number {
  if (node.kind === "source") return 15;
  const input = node.inputIds.reduce((maximum, id) => Math.max(maximum, powers[id] ?? 0), 0);
  if (frame < node.delayFrames) return 0;
  switch (node.kind) {
    case "wire": return Math.max(0, input - 1);
    case "repeater": return input > 0 ? 15 : 0;
    case "comparator": return input >= node.threshold ? input : 0;
    case "piston":
    case "lamp":
    case "door":
    case "output": return input >= node.threshold ? input : 0;
  }
}

function samplePolyline(path: readonly UltraVector3[], progress: number): UltraVector3 {
  if (path.length === 1) return path[0];
  const lengths = path.slice(1).map((point, index) => distance(path[index], point));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  if (total <= 1e-8) return path[0];
  let target = total * progress;
  for (let index = 0; index < lengths.length; index += 1) {
    if (target <= lengths[index]) return lerpVector(path[index], path[index + 1], target / Math.max(lengths[index], 1e-8));
    target -= lengths[index];
  }
  return path.at(-1)!;
}

function randomDirection(seed: number, index: number): UltraVector3 {
  const theta = deterministicUnit(seed, index) * Math.PI * 2;
  const y = deterministicUnit(seed ^ 0x5f3759df, index) * 0.8 + 0.2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  return [Math.cos(theta) * radius, y, Math.sin(theta) * radius];
}

function positionKey(value: SetLayerOperation | UltraVector3): string {
  if ("x" in value) return `${Math.round(value.x)},${Math.round(value.y)},${Math.round(value.z)}`;
  return `${Math.round(value[0])},${Math.round(value[1])},${Math.round(value[2])}`;
}

function isFiniteVector(value: UltraVector3): boolean { return value.every(Number.isFinite); }
function deterministicUnit(seed: number, index: number): number { let value = (Math.trunc(seed) ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 0x100000000; }
function snap(value: number, size: number): number { return Math.round(value / size) * size; }
function smoothstep(value: number): number { return value * value * (3 - 2 * value); }
function add(a: UltraVector3, b: UltraVector3): UltraVector3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function subtract(a: UltraVector3, b: UltraVector3): UltraVector3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function scale(value: UltraVector3, scalar: number): UltraVector3 { return [value[0] * scalar, value[1] * scalar, value[2] * scalar]; }
function length(value: UltraVector3): number { return Math.hypot(value[0], value[1], value[2]); }
function normalize(value: UltraVector3): UltraVector3 { const len = length(value); return len <= 1e-8 ? [0, 0, 0] : scale(value, 1 / len); }
function distance(a: UltraVector3, b: UltraVector3): number { return length(subtract(a, b)); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function lerpVector(a: UltraVector3, b: UltraVector3, t: number): UltraVector3 { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function clamp01(value: number): number { return clamp(finite(value), 0, 1); }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)); }
function finite(value: number, fallback = 0): number { return Number.isFinite(value) ? value : fallback; }
function canonical(value: number): number { const finiteValue = finite(value); return Object.is(finiteValue, -0) ? 0 : Number(finiteValue.toFixed(8)); }
function canonicalVector(value: readonly [number, number, number]): UltraVector3 { return [canonical(value[0]), canonical(value[1]), canonical(value[2])]; }
