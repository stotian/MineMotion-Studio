import { ANIMATION_PRESETS, type AnimationPreset } from "./AnimationPresets";
import { BLOCK_PALETTE_PRESETS, type BlockPalettePreset } from "./BlockPalettePresets";
import { CAMERA_PRESETS, type CameraPreset } from "./CameraPresets";
import { RIG_POSE_PRESETS, type RigPosePreset } from "./RigPosePresets";

export interface PresetRegistrySnapshot {
  camera: CameraPreset[];
  rigPose: RigPosePreset[];
  animation: AnimationPreset[];
  blockPalette: BlockPalettePreset[];
}

export class PresetRegistry {
  private camera = new Map<string, CameraPreset>();
  private rigPose = new Map<string, RigPosePreset>();
  private animation = new Map<string, AnimationPreset>();
  private blockPalette = new Map<string, BlockPalettePreset>();

  constructor() {
    CAMERA_PRESETS.forEach((preset) => this.registerCameraPreset(preset));
    RIG_POSE_PRESETS.forEach((preset) => this.registerRigPosePreset(preset));
    ANIMATION_PRESETS.forEach((preset) => this.registerAnimationPreset(preset));
    BLOCK_PALETTE_PRESETS.forEach((preset) =>
      this.registerBlockPalettePreset(preset)
    );
  }

  registerCameraPreset(preset: CameraPreset): void {
    this.camera.set(preset.id, preset);
  }

  registerRigPosePreset(preset: RigPosePreset): void {
    this.rigPose.set(preset.id, preset);
  }

  registerAnimationPreset(preset: AnimationPreset): void {
    this.animation.set(preset.id, preset);
  }

  registerBlockPalettePreset(preset: BlockPalettePreset): void {
    this.blockPalette.set(preset.id, preset);
  }

  snapshot(): PresetRegistrySnapshot {
    return {
      camera: [...this.camera.values()],
      rigPose: [...this.rigPose.values()],
      animation: [...this.animation.values()],
      blockPalette: [...this.blockPalette.values()]
    };
  }

  getCameraPreset(id: string): CameraPreset | undefined {
    return this.camera.get(id);
  }

  getRigPosePreset(id: string): RigPosePreset | undefined {
    return this.rigPose.get(id);
  }

  getAnimationPreset(id: string): AnimationPreset | undefined {
    return this.animation.get(id);
  }
}

export const presetRegistry = new PresetRegistry();

