import * as THREE from "three";
import { getBlockDefinition } from "../minecraft/BlockPalette";
import type { BlockId } from "../minecraft/MinecraftWorldTypes";
import type {
  MinecraftResourceSettings,
  ResourcePackAsset
} from "../minecraft/resources/ResourcePackTypes";
import { TextureResolver } from "../minecraft/resources/TextureResolver";
import { resolveBiomeTint } from "../minecraft/resources/BiomeTint";
import { getMaterialPresetForBlock } from "../minecraft/materials/MinecraftMaterialPresets";

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export interface MinecraftMaterialContext {
  resourcePack?: ResourcePackAsset | null;
  settings?: MinecraftResourceSettings;
}

export function getMaterialForBlock(
  blockId: BlockId,
  context: MinecraftMaterialContext = {}
): THREE.MeshStandardMaterial {
  const cacheKey = createCacheKey(blockId, context);
  const cached = materialCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const block = getBlockDefinition(blockId);
  const resolution = TextureResolver.resolve(context.resourcePack, blockId);
  const materialSettings = context.settings?.materials;
  const preset = getMaterialPresetForBlock(blockId, materialSettings);
  const biomeTint = context.settings
    ? resolveBiomeTint(blockId, context.settings.biomeTint)
    : null;
  const texture = resolution.texture
    ? loadMinecraftTexture(
        resolution.texture.dataUrl,
        context.settings?.textureFiltering ?? "nearest"
      )
    : null;
  const material = new THREE.MeshStandardMaterial({
    color: biomeTint ?? (texture ? "#ffffff" : block.color),
    map: texture,
    roughness: preset.roughness,
    metalness: preset.metalness,
    transparent: preset.transparent || block.transparent,
    opacity: Math.min(preset.opacity, block.opacity),
    alphaTest: preset.alphaTest,
    depthWrite: preset.depthWrite,
    emissive: preset.emissiveColor,
    emissiveIntensity: preset.emissiveIntensity,
    side: preset.transparent ? THREE.DoubleSide : THREE.FrontSide
  });

  material.name = `${blockId}:${preset.id}:${resolution.status}`;
  materialCache.set(cacheKey, material);
  return material;
}

export function clearMinecraftMaterialCache(): void {
  for (const material of materialCache.values()) {
    material.map?.dispose();
    material.dispose();
  }
  materialCache.clear();
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
  dataUrl: string,
  filtering: "nearest" | "linear"
): THREE.Texture {
  const texture = new THREE.TextureLoader().load(dataUrl);
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

function createCacheKey(
  blockId: BlockId,
  context: MinecraftMaterialContext
): string {
  const settings = context.settings;
  return [
    blockId,
    context.resourcePack?.id ?? "fallback",
    settings?.textureFiltering ?? "nearest",
    settings?.biomeTint.enabled ? settings.biomeTint.presetId : "no-tint",
    settings?.biomeTint.grassColor ?? "",
    settings?.biomeTint.foliageColor ?? "",
    settings?.biomeTint.waterColor ?? "",
    settings?.materials.overrides[blockId] ?? "auto"
  ].join(":");
}
