import type { Vector3Tuple } from "../project/ProjectFile";

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

export type EffectSpace = "screen" | "world" | "camera";

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
