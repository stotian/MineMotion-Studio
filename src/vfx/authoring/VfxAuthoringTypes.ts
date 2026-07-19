import type {
  VfxBlendMode,
  VfxRenderLayer,
  VfxSpace
} from "../core/VfxDefinition";
import type { VfxQuality } from "../core/VfxEvaluationContext";
import type { VfxTarget } from "../core/VfxInstance";
import type {
  VfxParticleEmitterDescriptor,
  VfxPrimitiveDescriptor
} from "../primitives/VfxPrimitiveTypes";

export const VFX_AUTHORING_DOCUMENT_VERSION = 1 as const;
export const MAX_VFX_AUTHORING_STACK_ITEMS = 16;

export type VfxAuthoringPrimitiveDescriptor = Exclude<
  VfxPrimitiveDescriptor,
  VfxParticleEmitterDescriptor
>;

export type VfxAuthoringSource =
  | { kind: "blank" }
  | {
      kind: "derived-builtin";
      presetId: string;
      definitionId: string;
    };

interface VfxAuthoringStackItemBase<TKind extends string> {
  id: string;
  kind: TKind;
  label: string;
  enabled: boolean;
}

export interface VfxAuthoringPrimitiveItem
  extends VfxAuthoringStackItemBase<"primitive"> {
  descriptor: VfxAuthoringPrimitiveDescriptor;
}

export interface VfxAuthoringEmitterItem
  extends VfxAuthoringStackItemBase<"emitter"> {
  descriptor: VfxParticleEmitterDescriptor;
}

export type VfxAuthoringModifier =
  | { kind: "tint"; color: string }
  | { kind: "opacity"; multiplier: number }
  | { kind: "scale"; multiplier: number };

export interface VfxAuthoringModifierItem
  extends VfxAuthoringStackItemBase<"modifier"> {
  modifier: VfxAuthoringModifier;
}

export type VfxAuthoringStackItem =
  | VfxAuthoringPrimitiveItem
  | VfxAuthoringEmitterItem
  | VfxAuthoringModifierItem;

/**
 * Structured-cloneable authoring data only. Functions, GPU resources, script,
 * and unrestricted shader content are deliberately absent from this contract.
 */
export interface VfxAuthoringDocument {
  version: typeof VFX_AUTHORING_DOCUMENT_VERSION;
  id: string;
  displayName: string;
  description: string;
  source: VfxAuthoringSource;
  durationFrames: number;
  space: VfxSpace;
  target: VfxTarget | null;
  seed: string;
  blendMode: VfxBlendMode;
  renderLayer: VfxRenderLayer;
  previewQuality: VfxQuality;
  exportQuality: VfxQuality;
  stack: readonly VfxAuthoringStackItem[];
}
