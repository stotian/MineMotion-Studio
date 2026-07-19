import type { Vector3Tuple } from "../core/scene/SceneTypes";
import type { VfxSpace } from "../vfx/core/VfxDefinition";

export type EffectType =
  | "lightningStrike"
  | "impactFrame"
  | "cameraShake"
  | "flash"
  | "speedLines"
  | "shockwave"
  | "glowBurst"
  | "fogPulse"
  | "vignettePulse"
  | "colorGradeKeyframe"
  | "cinematicBars"
  | "explosionFlash";

export type EffectSpace = VfxSpace;

export const MAX_LEGACY_EFFECT_PARTICLE_COUNT = 1_024;
export const MAX_LEGACY_ACTIVE_WORLD_EFFECTS = 64;
export const MAX_LEGACY_PARTICLES_PER_FRAME = 4_096;
export const MAX_EFFECT_INSTANCES = 4_096;

export interface EffectParameters {
  color?: string;
  secondaryColor?: string;
  intensity?: number;
  alpha?: number;
  radius?: number;
  size?: number;
  count?: number;
  frequency?: number;
  strength?: number;
  decay?: number;
  direction?: "forward" | "backward" | "left" | "right" | "radial";
  barStyle?: "16:9" | "2.35:1";
  contrast?: number;
  saturation?: number;
  speed?: number;
  flash?: boolean;
}

export interface EffectDefinition {
  type: EffectType;
  name: string;
  description: string;
  space: EffectSpace;
  defaultDurationFrames: number;
  defaultParameters: EffectParameters;
  tags: string[];
}

export interface EffectInstance {
  id: string;
  type: EffectType;
  name: string;
  startFrame: number;
  durationFrames: number;
  position: Vector3Tuple;
  targetObjectId: string;
  parameters: EffectParameters;
  enabled: boolean;
}

export function getBoundedLegacyParticleCount(
  effect: Pick<EffectInstance, "type" | "parameters">,
  remainingBudget = MAX_LEGACY_PARTICLES_PER_FRAME
): number {
  if (effect.type !== "glowBurst") return 0;
  const rawCount = effect.parameters.count ?? 18;
  const requested =
    typeof rawCount === "number" && Number.isFinite(rawCount)
      ? Math.max(0, Math.round(rawCount))
      : 18;
  const safeRemaining = Number.isFinite(remainingBudget)
    ? Math.max(0, Math.floor(remainingBudget))
    : 0;
  return Math.min(
    MAX_LEGACY_EFFECT_PARTICLE_COUNT,
    safeRemaining,
    requested
  );
}

export interface TimelineEffectItem {
  effectId: string;
  startFrame: number;
  durationFrames: number;
}

export function isEffectActive(
  effect: EffectInstance,
  frame: number
): boolean {
  return (
    effect.enabled &&
    frame >= effect.startFrame &&
    frame <= effect.startFrame + effect.durationFrames
  );
}

export function getEffectProgress(
  effect: EffectInstance,
  frame: number
): number {
  if (effect.durationFrames <= 0) return 1;
  return Math.min(
    1,
    Math.max(0, (frame - effect.startFrame) / effect.durationFrames)
  );
}
