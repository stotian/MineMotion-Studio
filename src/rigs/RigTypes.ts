export type RigVector3Tuple = [number, number, number];

export type RigPresetId =
  | "default_steve"
  | "steve"
  | "alex"
  | "generic_blocky"
  | "armored_player"
  | "zombie"
  | "skeleton"
  | "creeper"
  | "enderman";

export type MinecraftSkinModelType = "steve" | "alex" | "unknown";

export interface MinecraftSkinMetadata {
  width: number;
  height: number;
  valid: boolean;
  legacy: boolean;
  modelType: MinecraftSkinModelType;
  warnings: string[];
}

export interface MinecraftSkinAsset {
  id: string;
  name: string;
  dataUrl: string;
  importedAt: string;
  metadata: MinecraftSkinMetadata;
}

export type CharacterAttachmentPointId = "rightHand" | "leftHand" | "head" | "back";

export type CharacterAttachmentKind =
  | "placeholder_sword"
  | "placeholder_item_cube"
  | "obj";

export interface CharacterAttachment {
  id: string;
  name: string;
  pointId: CharacterAttachmentPointId;
  kind: CharacterAttachmentKind;
  assetId?: string;
  visible: boolean;
}

export type BoneInterpolation = "constant" | "linear" | "easeIn" | "easeOut" | "easeInOut";

export interface BoneKeyframe {
  frame: number;
  rotation: RigVector3Tuple;
  interpolation: BoneInterpolation;
}

export interface BoneAnimationTrack {
  id: string;
  boneId: string;
  keyframes: BoneKeyframe[];
}

export interface RigPose {
  id: string;
  name: string;
  description: string;
  boneRotations: Record<string, RigVector3Tuple>;
}

export interface RigAnimationKeyframe {
  frame: number;
  boneRotations: Record<string, RigVector3Tuple>;
}

export interface RigAnimationClip {
  id: string;
  name: string;
  description: string;
  durationFrames: number;
  loop: boolean;
  keyframes: RigAnimationKeyframe[];
}

export interface BlockbenchModelAsset {
  id: string;
  name: string;
  formatVersion: string;
  elementCount: number;
  groupCount: number;
  textureCount: number;
  importedAt: string;
  warnings: string[];
  rawJson: string;
}

export interface RigProjectData {
  savedPoses: RigPose[];
  animationClips: RigAnimationClip[];
  blockbenchModels: BlockbenchModelAsset[];
}
