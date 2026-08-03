import * as THREE from "three";
import { getBlockDefinition } from "../minecraft/BlockPalette";
import type { BlockId } from "../minecraft/MinecraftWorldTypes";
import type {
  BlockTextureFace,
  MinecraftResourceSettings,
  ResourcePackAnimationMetadata,
  ResourcePackAsset,
  ResourcePackTextureAsset
} from "../minecraft/resources/ResourcePackTypes";
import { TextureResolver } from "../minecraft/resources/TextureResolver";
import { resolveBiomeTint } from "../minecraft/resources/BiomeTint";
import { getMaterialPresetForBlock } from "../minecraft/materials/MinecraftMaterialPresets";
import { markSharedThreeResource } from "./ThreeResourceDisposal";

export interface MinecraftMaterialContext {
  resourcePack?: ResourcePackAsset | null;
  settings?: MinecraftResourceSettings;
  materialCache?: MinecraftMaterialCache;
}

export interface MinecraftMaterialCacheDisposal {
  materials: number;
  textures: number;
}

interface AnimatedTextureState {
  readonly texture: THREE.Texture;
  readonly metadata: ResourcePackAnimationMetadata;
  readonly playbackRate: number;
  frameCount: number;
}

export class MinecraftMaterialCache {
  private readonly materials = new Map<string, THREE.MeshStandardMaterial>();
  private readonly animatedTextures = new Map<string, AnimatedTextureState>();

  get(
    blockId: BlockId,
    context: MinecraftMaterialContext = {},
    face: BlockTextureFace = "all"
  ): THREE.MeshStandardMaterial {
    const cacheKey = createCacheKey(blockId, face, context);
    const cached = this.materials.get(cacheKey);
    if (cached) return cached;

    const block = getBlockDefinition(blockId);
    const resolution = TextureResolver.resolve(context.resourcePack, blockId, face);
    const materialSettings = context.settings?.materials;
    const preset = getMaterialPresetForBlock(blockId, materialSettings);
    const biomeTint = context.settings
      ? resolveBiomeTint(blockId, context.settings.biomeTint)
      : null;
    const waterSettings = context.settings?.water;
    const texture = resolution.texture
      ? loadMinecraftTexture(
          resolution.texture,
          context.settings?.textureFiltering ?? "nearest",
          blockId === "water" ? waterSettings?.animationSpeed ?? 1 : 1,
          (state) => this.animatedTextures.set(state.texture.uuid, state)
        )
      : null;
    const isWater = blockId === "water";
    const material = markSharedThreeResource(new THREE.MeshStandardMaterial({
      color: biomeTint ?? (texture ? "#ffffff" : block.color),
      map: texture,
      roughness: isWater ? waterSettings?.roughness ?? preset.roughness : preset.roughness,
      metalness: preset.metalness,
      transparent: preset.transparent || block.transparent,
      opacity: isWater
        ? Math.min(waterSettings?.opacity ?? preset.opacity, block.opacity)
        : Math.min(preset.opacity, block.opacity),
      alphaTest: preset.alphaTest,
      depthWrite: preset.depthWrite,
      emissive: preset.emissiveColor,
      emissiveIntensity: isWater
        ? waterSettings?.emissiveIntensity ?? preset.emissiveIntensity
        : preset.emissiveIntensity,
      side: preset.transparent ? THREE.DoubleSide : THREE.FrontSide
    }));

    material.name = `${blockId}:${face}:${preset.id}:${resolution.status}`;
    this.materials.set(cacheKey, material);
    return material;
  }

  updateAnimations(timeMs: number): void {
    const safeTime = Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0;
    for (const state of this.animatedTextures.values()) {
      if (state.frameCount <= 1) continue;
      const frame = resolveAnimationFrame(
        state.metadata,
        state.frameCount,
        safeTime * state.playbackRate
      );
      state.texture.repeat.set(1, 1 / state.frameCount);
      state.texture.offset.set(0, 1 - (frame + 1) / state.frameCount);
      state.texture.needsUpdate = true;
    }
  }

  clear(): MinecraftMaterialCacheDisposal {
    const textures = new Set<THREE.Texture>();
    for (const material of this.materials.values()) {
      if (material.map) textures.add(material.map);
    }
    for (const texture of textures) texture.dispose();
    for (const material of this.materials.values()) material.dispose();
    const materials = this.materials.size;
    this.materials.clear();
    this.animatedTextures.clear();
    return { materials, textures: textures.size };
  }
}

const defaultMaterialCache = new MinecraftMaterialCache();

export function getMaterialForBlock(
  blockId: BlockId,
  context: MinecraftMaterialContext = {},
  face: BlockTextureFace = "all"
): THREE.MeshStandardMaterial {
  return (context.materialCache ?? defaultMaterialCache).get(
    blockId,
    context,
    face
  );
}

export function clearMinecraftMaterialCache(): MinecraftMaterialCacheDisposal {
  return defaultMaterialCache.clear();
}

export function createMinecraftMaterialContextSignature(
  context: MinecraftMaterialContext
): string {
  const settings = context.settings;
  const overrides = Object.entries(settings?.materials.overrides ?? {})
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([blockId, presetId]) => `${blockId}=${presetId}`)
    .join(",");
  return [
    context.resourcePack?.id ?? "fallback",
    context.resourcePack?.importedAt ?? "",
    settings?.textureFiltering ?? "nearest",
    settings?.biomeTint.enabled ? settings.biomeTint.presetId : "no-tint",
    settings?.biomeTint.grassColor ?? "",
    settings?.biomeTint.foliageColor ?? "",
    settings?.biomeTint.waterColor ?? "",
    settings?.materials.defaultPresetId ?? "solid",
    settings?.water.opacity ?? "",
    settings?.water.roughness ?? "",
    settings?.water.animationSpeed ?? "",
    settings?.water.emissiveIntensity ?? "",
    overrides
  ].join(":");
}

export function createSolidMaterial(
  color: string,
  options: Partial<THREE.MeshStandardMaterialParameters> = {}
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0,
    ...options
  });
}

function loadMinecraftTexture(
  asset: ResourcePackTextureAsset,
  filtering: "nearest" | "linear",
  playbackRate: number,
  onAnimatedTexture: (state: AnimatedTextureState) => void
): THREE.Texture {
  let texture: THREE.Texture;
  texture = new THREE.TextureLoader().load(asset.dataUrl, (loaded) => {
    const image = loaded.image as { width?: number; height?: number } | undefined;
    const width = Math.max(1, Math.trunc(image?.width ?? 1));
    const height = Math.max(1, Math.trunc(image?.height ?? width));
    const frameCount = Math.max(1, Math.floor(height / width));
    if (asset.animation && frameCount > 1) {
      loaded.wrapS = THREE.ClampToEdgeWrapping;
      loaded.wrapT = THREE.RepeatWrapping;
      loaded.repeat.set(1, 1 / frameCount);
      loaded.offset.set(0, 1 - 1 / frameCount);
      onAnimatedTexture({
        texture: loaded,
        metadata: asset.animation,
        playbackRate: Number.isFinite(playbackRate) ? Math.max(0, playbackRate) : 1,
        frameCount
      });
    }
    loaded.needsUpdate = true;
  });
  markSharedThreeResource(texture);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter =
    filtering === "nearest" ? THREE.NearestFilter : THREE.LinearFilter;
  texture.minFilter =
    filtering === "nearest"
      ? THREE.NearestFilter
      : THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = filtering === "linear";
  texture.needsUpdate = true;
  return texture;
}

export function resolveAnimationFrame(
  metadata: ResourcePackAnimationMetadata,
  frameCount: number,
  timeMs: number
): number {
  const safeFrameCount = Math.max(1, Math.floor(frameCount));
  const frames = metadata.frames.length > 0
    ? metadata.frames.filter((frame) => frame.index < safeFrameCount)
    : Array.from({ length: safeFrameCount }, (_, index) => ({ index }));
  if (frames.length === 0) return 0;
  const durations = frames.map(
    (frame) => Math.max(1, frame.timeTicks ?? metadata.frameTimeTicks) * 50
  );
  const cycle = durations.reduce((sum, duration) => sum + duration, 0);
  let cursor = cycle > 0 ? timeMs % cycle : 0;
  for (let index = 0; index < frames.length; index += 1) {
    if (cursor < durations[index]) return frames[index].index;
    cursor -= durations[index];
  }
  return frames.at(-1)?.index ?? 0;
}

function createCacheKey(
  blockId: BlockId,
  face: BlockTextureFace,
  context: MinecraftMaterialContext
): string {
  return `${blockId}:${face}:${createMinecraftMaterialContextSignature(context)}`;
}
