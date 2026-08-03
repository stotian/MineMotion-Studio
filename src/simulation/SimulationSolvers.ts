import type { Vector3Tuple } from "../project/ProjectFile";
import { createDeterministicRandom, deterministicNoise } from "./SimulationRandom";
import { SIMULATION_BUDGETS, type SimulationDefinition, type SimulationSample } from "./SimulationTypes";

export function sampleSimulation(definition: SimulationDefinition, frame: number, fps: number): SimulationSample[] {
  if (!definition.enabled || frame < definition.startFrame || frame > definition.endFrame) return [];
  const localFrame = frame - definition.startFrame;
  const t = localFrame / Math.max(1, fps);
  const budget = SIMULATION_BUDGETS[definition.quality];
  const subjects = definition.targetIds.slice(0, budget.maxSubjects);
  if (definition.kind === "debris") return subjects.map((id, index) => debrisSample(definition, id, index, frame, t));
  if (definition.kind === "particle-collision") return subjects.map((id, index) => collisionSample(definition, id, index, frame, t));
  if (definition.kind === "cloth") return clothSamples(definition, subjects, frame, t);
  if (definition.kind === "shockwave") return subjects.map((id, index) => shockwaveSample(definition, id, index, frame, t));
  if (definition.kind === "crowd-path") return subjects.map((id, index) => pathSample(definition, id, index, frame, t));
  if (definition.kind === "camera-noise") return subjects.map((id, index) => cameraNoiseSample(definition, id, index, frame, t));
  return subjects.map((id, index) => windSample(definition, id, index, frame, t));
}

function debrisSample(definition: SimulationDefinition, id: string, index: number, frame: number, t: number): SimulationSample {
  const random = createDeterministicRandom(definition.seed + index * 7919);
  const speed = numberParameter(definition, "speed", 5) * (0.65 + random() * 0.7);
  const angle = random() * Math.PI * 2;
  const vertical = numberParameter(definition, "verticalSpeed", 7) * (0.7 + random() * 0.5);
  const gravity = numberParameter(definition, "gravity", 9.81);
  const floor = numberParameter(definition, "floorY", 0);
  const origin = vectorParameter(definition, "origin", [0, 1, 0]);
  const rawY = origin[1] + vertical * t - 0.5 * gravity * t * t;
  const hitTime = vertical / Math.max(0.001, gravity);
  const bounceTime = Math.max(0, t - hitTime);
  const y = rawY >= floor ? rawY : floor + Math.abs(vertical * 0.28 * bounceTime - 0.5 * gravity * bounceTime * bounceTime);
  const position: Vector3Tuple = [origin[0] + Math.cos(angle) * speed * t, Math.max(floor, y), origin[2] + Math.sin(angle) * speed * t];
  return { frame, subjectId: id, position, rotation: [t * 130 * (random() - 0.5), t * 170, t * 90], scale: [1, 1, 1], velocity: [Math.cos(angle) * speed, vertical - gravity * t, Math.sin(angle) * speed] };
}

function collisionSample(definition: SimulationDefinition, id: string, index: number, frame: number, t: number): SimulationSample {
  const radius = numberParameter(definition, "radius", 8);
  const speed = numberParameter(definition, "speed", 4);
  const random = createDeterministicRandom(definition.seed + index * 131);
  const angle = random() * Math.PI * 2;
  const distance = Math.abs(((t * speed + random() * radius * 2) % (radius * 2)) - radius);
  return { frame, subjectId: id, position: [Math.cos(angle) * distance, numberParameter(definition, "floorY", 0.2), Math.sin(angle) * distance], rotation: [0, -angle * 180 / Math.PI, 0], scale: [1, 1, 1], velocity: [Math.cos(angle) * speed, 0, Math.sin(angle) * speed] };
}

function clothSamples(definition: SimulationDefinition, subjects: readonly string[], frame: number, t: number): SimulationSample[] {
  const wind = numberParameter(definition, "wind", 1.5);
  const damping = numberParameter(definition, "damping", 0.88);
  return subjects.map((id, index) => {
    const phase = t * 4 + index * 0.45;
    const displacement = Math.sin(phase) * wind * Math.pow(damping, index * 0.08);
    return { frame, subjectId: id, position: [displacement * 0.08, -index * 0.12, displacement * 0.16], rotation: [displacement * 8, 0, displacement * 4], scale: [1, 1, 1], intensity: Math.abs(displacement) };
  });
}

function shockwaveSample(definition: SimulationDefinition, id: string, index: number, frame: number, t: number): SimulationSample {
  const random = createDeterministicRandom(definition.seed + index * 17);
  const angle = random() * Math.PI * 2;
  const radius = numberParameter(definition, "speed", 12) * t;
  const falloff = Math.max(0, 1 - t / Math.max(0.01, numberParameter(definition, "duration", 1.2)));
  return { frame, subjectId: id, position: [Math.cos(angle) * radius, Math.sin(t * Math.PI) * falloff * 2, Math.sin(angle) * radius], rotation: [0, angle * 180 / Math.PI, 0], scale: [1 + falloff * 0.2, 1 + falloff * 0.2, 1 + falloff * 0.2], intensity: falloff };
}

function pathSample(definition: SimulationDefinition, id: string, index: number, frame: number, t: number): SimulationSample {
  const radius = numberParameter(definition, "radius", 10);
  const speed = numberParameter(definition, "speed", 1.4);
  const angle = (t * speed / Math.max(1, radius)) + index * 2.399963;
  return { frame, subjectId: id, position: [Math.cos(angle) * radius, numberParameter(definition, "floorY", 1.05), Math.sin(angle) * radius], rotation: [0, -angle * 180 / Math.PI + 90, 0], scale: [1, 1, 1] };
}

function cameraNoiseSample(definition: SimulationDefinition, id: string, index: number, frame: number, t: number): SimulationSample {
  const amplitude = numberParameter(definition, "amplitude", 0.08);
  const frequency = numberParameter(definition, "frequency", 2.4);
  const sampleFrame = Math.floor(t * frequency * 60);
  return { frame, subjectId: id, position: [deterministicNoise(definition.seed, sampleFrame, index) * amplitude, deterministicNoise(definition.seed, sampleFrame, index + 11) * amplitude, deterministicNoise(definition.seed, sampleFrame, index + 23) * amplitude], rotation: [deterministicNoise(definition.seed, sampleFrame, index + 31) * amplitude * 12, deterministicNoise(definition.seed, sampleFrame, index + 47) * amplitude * 12, deterministicNoise(definition.seed, sampleFrame, index + 59) * amplitude * 8], scale: [1, 1, 1] };
}

function windSample(definition: SimulationDefinition, id: string, index: number, frame: number, t: number): SimulationSample {
  const direction = vectorParameter(definition, "direction", [1, 0, 0]);
  const strength = numberParameter(definition, "strength", 1);
  const gust = 0.65 + 0.35 * Math.sin(t * numberParameter(definition, "frequency", 1.2) + index * 0.7);
  return { frame, subjectId: id, position: [direction[0] * strength * gust, direction[1] * strength * gust, direction[2] * strength * gust], rotation: [direction[2] * strength * 3, 0, -direction[0] * strength * 3], scale: [1, 1, 1], intensity: strength * gust };
}

function numberParameter(definition: SimulationDefinition, key: string, fallback: number): number {
  const value = definition.parameters[key]; return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function vectorParameter(definition: SimulationDefinition, key: string, fallback: Vector3Tuple): Vector3Tuple {
  const value = definition.parameters[key]; return Array.isArray(value) && value.length === 3 && value.every((entry) => typeof entry === "number" && Number.isFinite(entry)) ? [value[0], value[1], value[2]] : fallback;
}
