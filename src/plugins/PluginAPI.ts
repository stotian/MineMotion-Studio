import type { ProjectTemplate } from "../templates/TemplateTypes";
import type { BuiltinSfxDefinition } from "../audio/AudioTypes";
import type { EffectDefinition } from "../effects/EffectTypes";
import type { AnimationPreset } from "../presets/AnimationPresets";
import type { BlockPalettePreset } from "../presets/BlockPalettePresets";
import type { CameraPreset } from "../presets/CameraPresets";
import type { RigPosePreset } from "../presets/RigPosePresets";
import type { TimelineTrackType } from "../project/ProjectFile";
import type { PostProcessingPreset } from "../rendering/postprocessing/PostProcessingTypes";
import type { SkyPreset } from "../renderer/SkySystem";

export interface PluginExtensionPoints {
  templates?: ProjectTemplate[];
  skyPresets?: SkyPreset[];
  blockPalettes?: BlockPalettePreset[];
  cameraPresets?: CameraPreset[];
  rigPosePresets?: RigPosePreset[];
  animationPresets?: AnimationPreset[];
  effects?: EffectDefinition[];
  postProcessingPresets?: PostProcessingPreset[];
  sfx?: BuiltinSfxDefinition[];
  renderPresets?: string[];
  timelineItemTypes?: TimelineTrackType[];
  importers?: string[];
  exporters?: string[];
  tools?: string[];
}

export interface MineMotionPluginModule {
  extensions: PluginExtensionPoints;
}
