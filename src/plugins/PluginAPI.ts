import type { ProjectTemplate } from "../templates/TemplateTypes";
import type { AnimationPreset } from "../presets/AnimationPresets";
import type { BlockPalettePreset } from "../presets/BlockPalettePresets";
import type { CameraPreset } from "../presets/CameraPresets";
import type { RigPosePreset } from "../presets/RigPosePresets";
import type { SkyPreset } from "../renderer/SkySystem";

export interface PluginExtensionPoints {
  templates?: ProjectTemplate[];
  skyPresets?: SkyPreset[];
  blockPalettes?: BlockPalettePreset[];
  cameraPresets?: CameraPreset[];
  rigPosePresets?: RigPosePreset[];
  animationPresets?: AnimationPreset[];
  importers?: string[];
  exporters?: string[];
  tools?: string[];
}

export interface MineMotionPluginModule {
  extensions: PluginExtensionPoints;
}

