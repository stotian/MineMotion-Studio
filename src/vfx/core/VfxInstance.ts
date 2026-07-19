import type { TransformData } from "../../core/scene/SceneTypes";
import type {
  VfxBlendMode,
  VfxRenderLayer,
  VfxSpace
} from "./VfxDefinition";
import type { VfxQuality } from "./VfxEvaluationContext";
import type { VfxParameterValue } from "./VfxParameter";

export const VFX_INSTANCE_SERIALIZATION_VERSION = 1 as const;

export interface VfxTarget {
  entityId: string;
  boneId?: string;
}

export type VfxParameterKeyframeInterpolation =
  | "constant"
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";

export interface VfxParameterKeyframe {
  id: string;
  parameterId: string;
  localFrame: number;
  value: VfxParameterValue;
  interpolation: VfxParameterKeyframeInterpolation;
}

/**
 * Pure, structured-cloneable VFX data. Runtime/GPU objects must never be stored
 * here so project history and deterministic offline evaluation remain safe.
 */
export interface VfxInstance {
  serializationVersion: typeof VFX_INSTANCE_SERIALIZATION_VERSION;
  id: string;
  definitionId: string;
  displayName: string;
  startFrame: number;
  durationFrames: number;
  enabled: boolean;
  space: VfxSpace;
  transform: TransformData;
  target: VfxTarget | null;
  seed: string;
  parameters: Readonly<Record<string, VfxParameterValue>>;
  parameterKeyframes: readonly VfxParameterKeyframe[];
  blendMode: VfxBlendMode;
  renderLayer: VfxRenderLayer;
  previewQuality: VfxQuality;
  exportQuality: VfxQuality;
}

/** Matches the current inclusive EffectInstance timing contract. */
export function isVfxActive(instance: VfxInstance, frame: number): boolean {
  return (
    instance.enabled &&
    frame >= instance.startFrame &&
    frame <= instance.startFrame + instance.durationFrames
  );
}

export function getVfxProgress(instance: VfxInstance, frame: number): number {
  if (instance.durationFrames <= 0) return 1;
  return Math.min(
    1,
    Math.max(0, (frame - instance.startFrame) / instance.durationFrames)
  );
}
