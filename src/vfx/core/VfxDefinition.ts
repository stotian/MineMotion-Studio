import type { VfxParameterSchema } from "./VfxParameterSchema";

export const VFX_DEFINITION_VERSION = 1 as const;

export type VfxSpace = "world" | "screen" | "camera";
export type VfxBlendMode =
  | "normal"
  | "additive"
  | "multiply"
  | "screen"
  | "difference";
export type VfxRenderLayer = "world" | "camera" | "overlay" | "post";

export interface VfxDefinition {
  version: typeof VFX_DEFINITION_VERSION;
  id: string;
  displayName: string;
  description: string;
  space: VfxSpace;
  defaultDurationFrames: number;
  defaultBlendMode: VfxBlendMode;
  defaultRenderLayer: VfxRenderLayer;
  parameterSchema: VfxParameterSchema;
  tags: readonly string[];
}
