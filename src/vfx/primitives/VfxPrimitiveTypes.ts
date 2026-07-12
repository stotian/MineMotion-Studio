import type { TransformData, Vector3Tuple } from "../../core/scene/SceneTypes";
import type {
  VfxBlendMode,
  VfxRenderLayer,
  VfxSpace
} from "../core/VfxDefinition";
import type { VfxQuality } from "../core/VfxEvaluationContext";
import type { VfxTarget } from "../core/VfxInstance";

export const VFX_PRIMITIVE_VERSION = 1 as const;

export const VFX_PRIMITIVE_LIMITS = Object.freeze({
  particles: 1_024,
  beamSubdivisions: 256,
  trailControlPoints: 64,
  trailSegments: 256,
  ringSegments: 256
});

export type VfxPrimitiveKind =
  | "particle-emitter"
  | "beam"
  | "trail"
  | "expanding-ring"
  | "light-pulse";

interface VfxPrimitiveDescriptorBase<TKind extends VfxPrimitiveKind> {
  version: typeof VFX_PRIMITIVE_VERSION;
  id: string;
  kind: TKind;
  color: string;
}

export type VfxParticleSpawnShape = "point" | "sphere" | "ring" | "box";

export interface VfxParticleEmitterDescriptor
  extends VfxPrimitiveDescriptorBase<"particle-emitter"> {
  count: number;
  shape: VfxParticleSpawnShape;
  radius: number;
  speed: number;
  lifetimeSeconds: number;
  startSize: number;
  endSize: number;
  startOpacity: number;
  endOpacity: number;
}

export interface VfxBeamDescriptor
  extends VfxPrimitiveDescriptorBase<"beam"> {
  start: Vector3Tuple;
  end: Vector3Tuple;
  subdivisions: number;
  jitter: number;
  width: number;
  opacity: number;
}

export interface VfxTrailDescriptor
  extends VfxPrimitiveDescriptorBase<"trail"> {
  points: readonly Vector3Tuple[];
  segments: number;
  startWidth: number;
  endWidth: number;
  startOpacity: number;
  endOpacity: number;
}

export interface VfxExpandingRingDescriptor
  extends VfxPrimitiveDescriptorBase<"expanding-ring"> {
  center: Vector3Tuple;
  startRadius: number;
  endRadius: number;
  thickness: number;
  segments: number;
  startOpacity: number;
  endOpacity: number;
}

export interface VfxLightPulseDescriptor
  extends VfxPrimitiveDescriptorBase<"light-pulse"> {
  center: Vector3Tuple;
  startRadius: number;
  endRadius: number;
  baseIntensity: number;
  peakIntensity: number;
}

export type VfxPrimitiveDescriptor =
  | VfxParticleEmitterDescriptor
  | VfxBeamDescriptor
  | VfxTrailDescriptor
  | VfxExpandingRingDescriptor
  | VfxLightPulseDescriptor;

export interface VfxPrimitiveBudget {
  requested: number;
  capped: number;
  evaluated: number;
  hardCap: number;
}

export interface VfxPrimitiveSource {
  instanceId: string;
  definitionId: string;
  frame: number;
  localFrame: number;
  progress: number;
  localSeconds: number;
  durationSeconds: number;
  quality: VfxQuality;
  qualityScale: number;
}

export interface VfxPrimitivePlacement {
  space: VfxSpace;
  transform: TransformData;
  target: VfxTarget | null;
  blendMode: VfxBlendMode;
  renderLayer: VfxRenderLayer;
}

interface VfxPrimitiveEvaluationBase<TKind extends VfxPrimitiveKind> {
  version: typeof VFX_PRIMITIVE_VERSION;
  id: string;
  kind: TKind;
  primitiveSeed: number;
  source: VfxPrimitiveSource;
  placement: VfxPrimitivePlacement;
  color: string;
}

export interface VfxParticleSample {
  sampleIndex: number;
  position: Vector3Tuple;
  velocity: Vector3Tuple;
  size: number;
  opacity: number;
}

export interface VfxParticleEmitterEvaluation
  extends VfxPrimitiveEvaluationBase<"particle-emitter"> {
  budget: VfxPrimitiveBudget;
  age: number;
  lifetimeSeconds: number;
  particles: VfxParticleSample[];
}

export interface VfxGeometricSample {
  sampleIndex: number;
  position: Vector3Tuple;
}

export interface VfxBeamEvaluation
  extends VfxPrimitiveEvaluationBase<"beam"> {
  budget: VfxPrimitiveBudget;
  width: number;
  opacity: number;
  points: VfxGeometricSample[];
}

export interface VfxTrailSample extends VfxGeometricSample {
  width: number;
  opacity: number;
}

export interface VfxTrailEvaluation
  extends VfxPrimitiveEvaluationBase<"trail"> {
  budget: VfxPrimitiveBudget;
  points: VfxTrailSample[];
}

export interface VfxExpandingRingEvaluation
  extends VfxPrimitiveEvaluationBase<"expanding-ring"> {
  budget: VfxPrimitiveBudget;
  center: Vector3Tuple;
  radius: number;
  thickness: number;
  opacity: number;
  points: VfxGeometricSample[];
}

export interface VfxLightPulseEvaluation
  extends VfxPrimitiveEvaluationBase<"light-pulse"> {
  center: Vector3Tuple;
  radius: number;
  intensity: number;
}

export type VfxPrimitiveEvaluation =
  | VfxParticleEmitterEvaluation
  | VfxBeamEvaluation
  | VfxTrailEvaluation
  | VfxExpandingRingEvaluation
  | VfxLightPulseEvaluation;
