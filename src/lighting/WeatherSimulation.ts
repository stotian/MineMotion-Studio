import type { Vector3Tuple } from "../core/scene/SceneTypes";
import type { WeatherMode } from "./LightingTypes";

export interface WeatherSimulationSettings {
  mode: WeatherMode;
  intensity: number;
  seed: number;
  windDirection: Vector3Tuple;
  windSpeed: number;
}

export interface WeatherParticleSample {
  position: Vector3Tuple;
  velocity: Vector3Tuple;
  opacity: number;
  size: number;
}

export const MAX_WEATHER_PARTICLES = 1200;

export function weatherParticleCount(
  settings: WeatherSimulationSettings,
  maximum = MAX_WEATHER_PARTICLES
): number {
  if (settings.mode === "clear") return 0;
  const intensity = clamp(settings.intensity, 0, 1);
  const modeMultiplier = settings.mode === "storm" ? 1 : settings.mode === "snow" ? 0.72 : 0.84;
  return Math.min(
    Math.max(0, Math.trunc(maximum)),
    Math.max(0, Math.round(maximum * intensity * modeMultiplier))
  );
}

export function sampleWeatherParticle(
  index: number,
  frame: number,
  settings: WeatherSimulationSettings
): WeatherParticleSample {
  const safeIndex = Math.max(0, Math.trunc(index));
  const seed = Math.trunc(Number.isFinite(settings.seed) ? settings.seed : 0);
  const mode = settings.mode;
  const intensity = clamp(settings.intensity, 0, 1);
  const wind = normalizeHorizontal(settings.windDirection);
  const windSpeed = clamp(settings.windSpeed, 0, 8);
  const radius = mode === "storm" ? 34 : 28;
  const height = mode === "snow" ? 24 : 30;
  const xBase = signedRandom(seed, safeIndex, 0) * radius;
  const zBase = signedRandom(seed, safeIndex, 1) * radius;
  const startY = random(seed, safeIndex, 2) * height + 4;
  const phase = random(seed, safeIndex, 3);
  const fallSpeed = mode === "snow"
    ? 0.07 + random(seed, safeIndex, 4) * 0.055
    : mode === "storm"
      ? 0.34 + random(seed, safeIndex, 4) * 0.22
      : 0.24 + random(seed, safeIndex, 4) * 0.16;
  const time = Math.max(0, Number.isFinite(frame) ? frame : 0) + phase * height / fallSpeed;
  const travel = time * fallSpeed;
  const y = 4 + positiveModulo(startY - 4 - travel, height);
  const sway = mode === "snow"
    ? Math.sin(time * 0.055 + phase * Math.PI * 2) * 1.2
    : 0;
  const drift = time * windSpeed * (mode === "snow" ? 0.035 : 0.07);
  const x = wrapRange(xBase + wind[0] * drift + sway, radius);
  const z = wrapRange(zBase + wind[2] * drift + sway * 0.35, radius);

  return {
    position: [x, y, z],
    velocity: [
      wind[0] * windSpeed * 0.02,
      -fallSpeed,
      wind[2] * windSpeed * 0.02
    ],
    opacity: clamp(
      (mode === "snow" ? 0.54 : mode === "storm" ? 0.78 : 0.66) *
        (0.35 + intensity * 0.65),
      0,
      1
    ),
    size: mode === "snow"
      ? 0.11 + random(seed, safeIndex, 5) * 0.18
      : mode === "storm"
        ? 0.075
        : 0.065
  };
}

function normalizeHorizontal(direction: Vector3Tuple): Vector3Tuple {
  const x = Number.isFinite(direction[0]) ? direction[0] : 0;
  const z = Number.isFinite(direction[2]) ? direction[2] : 0;
  const length = Math.hypot(x, z);
  if (length < 0.0001) return [1, 0, 0];
  return [x / length, 0, z / length];
}

function random(seed: number, index: number, channel: number): number {
  let value = (seed ^ Math.imul(index + 1, 0x45d9f3b) ^ Math.imul(channel + 11, 0x27d4eb2d)) | 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 0x1_0000_0000;
}

function signedRandom(seed: number, index: number, channel: number): number {
  return random(seed, index, channel) * 2 - 1;
}

function wrapRange(value: number, radius: number): number {
  return positiveModulo(value + radius, radius * 2) - radius;
}

function positiveModulo(value: number, modulo: number): number {
  return ((value % modulo) + modulo) % modulo;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
}
