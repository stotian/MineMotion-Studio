import type { VfxParameterValue } from "../core/VfxParameter";
import { getBuiltinVfxRecipe } from "../recipes/BuiltinVfxRecipeRegistry";
import { prepareVfxPresetRecipe } from "../recipes/VfxPresetRecipeEvaluator";
import type { VfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveTypes";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";
import type { BuiltinVfxPreset } from "./BuiltinVfxPresetTypes";

export const VFX_PRESET_PREVIEW_CACHE_VERSION = 1 as const;
export const MAX_VFX_PRESET_PREVIEW_DATA_URL_LENGTH = 64_000;
const STORAGE_PREFIX = "minemotion.vfx-preview.";

export interface CachedVfxPresetPreview {
  version: typeof VFX_PRESET_PREVIEW_CACHE_VERSION;
  cacheKey: string;
  dataUrl: string;
}

export type VfxPreviewScheduler = (callback: () => void) => () => void;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function previewFrame(preset: BuiltinVfxPreset): VfxActiveFrameEvaluation {
  const parameters = Object.fromEntries(
    preset.definition.parameterSchema.map((parameter) => [
      parameter.id,
      parameter.defaultValue as VfxParameterValue
    ])
  );
  const durationFrames = preset.definition.defaultDurationFrames;
  const localFrame = Math.max(0, Math.floor(durationFrames * 0.4));
  return {
    status: "active",
    instanceId: `preview_${preset.metadata.id}`,
    definitionId: preset.metadata.definitionId,
    frame: localFrame,
    fps: 24,
    localFrame,
    progress: localFrame / durationFrames,
    localSeconds: localFrame / 24,
    durationSeconds: durationFrames / 24,
    rootSeed: 0x13a5f00d,
    frameSeed: 0x51deca7e,
    frameRandom: 0.35,
    quality: preset.metadata.previewQuality,
    qualityScale: 0.5,
    inputs: {
      space: preset.definition.space,
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      target: null,
      parameters,
      blendMode: preset.definition.defaultBlendMode,
      renderLayer: preset.definition.defaultRenderLayer
    }
  };
}

function renderDescriptor(descriptor: VfxPrimitiveDescriptor, index: number): string {
  const color = escapeXml(descriptor.color);
  const offset = index * 11;
  if (descriptor.kind === "particle-emitter") {
    return Array.from({ length: Math.min(12, descriptor.count) }, (_, particle) => {
      const x = 22 + ((particle * 29 + offset * 3) % 116);
      const y = 18 + ((particle * 17 + offset) % 54);
      const radius = Math.max(1.5, Math.min(5, descriptor.startSize * 18));
      return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="${Math.min(1, descriptor.startOpacity)}"/>`;
    }).join("");
  }
  if (descriptor.kind === "beam") {
    return `<polyline points="12,${70 - offset % 18} 52,${22 + offset % 20} 94,${58 - offset % 15} 148,${18 + offset % 28}" fill="none" stroke="${color}" stroke-width="${Math.max(1, Math.min(8, descriptor.width * 24))}" opacity="${Math.min(1, descriptor.opacity)}"/>`;
  }
  if (descriptor.kind === "trail") {
    return `<path d="M 10 ${68 - offset % 20} Q 72 ${12 + offset % 22} 150 ${48 + offset % 20}" fill="none" stroke="${color}" stroke-width="${Math.max(1, Math.min(10, descriptor.startWidth * 28))}" opacity="${Math.min(1, descriptor.startOpacity)}"/>`;
  }
  if (descriptor.kind === "expanding-ring") {
    return `<ellipse cx="80" cy="48" rx="${24 + offset % 28}" ry="${9 + offset % 13}" fill="none" stroke="${color}" stroke-width="${Math.max(1, Math.min(6, descriptor.thickness * 20))}" opacity="${Math.min(1, descriptor.startOpacity)}"/>`;
  }
  return `<circle cx="80" cy="45" r="${18 + offset % 18}" fill="${color}" opacity="${Math.min(0.72, Math.max(0.18, descriptor.peakIntensity * 0.22))}"/>`;
}

export function generateVfxDescriptorPreviewDataUrl(
  descriptors: readonly VfxPrimitiveDescriptor[],
  label: string,
  themeKey = "custom"
): string {
  const categoryHue = [...themeKey].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) % 360,
    210
  );
  const primitives = descriptors
    .map((descriptor, index) => renderDescriptor(descriptor, index))
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90" viewBox="0 0 160 90"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${categoryHue} 32% 12%)"/><stop offset="1" stop-color="hsl(${categoryHue} 42% 22%)"/></linearGradient></defs><rect width="160" height="90" rx="6" fill="url(#bg)"/>${primitives}<rect x="0" y="70" width="160" height="20" fill="#080a10" opacity=".78"/><text x="8" y="83" fill="#f1f4ff" font-family="system-ui,sans-serif" font-size="9">${escapeXml(label)}</text></svg>`;
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  if (dataUrl.length > MAX_VFX_PRESET_PREVIEW_DATA_URL_LENGTH) {
    throw new Error("Generated VFX descriptor preview is too large.");
  }
  return dataUrl;
}

export function generateVfxPresetPreviewDataUrl(preset: BuiltinVfxPreset): string {
  const recipe = getBuiltinVfxRecipe(preset.metadata.recipeId ?? "");
  if (!recipe) throw new Error(`Native preview recipe is missing: ${preset.metadata.id}`);
  const prepared = prepareVfxPresetRecipe(previewFrame(preset), recipe);
  if (!prepared.ok) {
    throw new Error(prepared.errors.map((error) => error.message).join(" "));
  }
  return generateVfxDescriptorPreviewDataUrl(
    prepared.value.descriptors,
    preset.localizedName,
    preset.metadata.category
  );
}

function storageKey(cacheKey: string): string {
  return `${STORAGE_PREFIX}${cacheKey}`;
}

export function readCachedVfxPresetPreview(
  storage: Pick<Storage, "getItem">,
  preset: BuiltinVfxPreset
): CachedVfxPresetPreview | null {
  if (preset.metadata.thumbnail.kind !== "generated") return null;
  try {
    const raw = storage.getItem(storageKey(preset.metadata.thumbnail.cacheKey));
    if (raw === null || raw.length > MAX_VFX_PRESET_PREVIEW_DATA_URL_LENGTH * 1.1) return null;
    const value = JSON.parse(raw) as Partial<CachedVfxPresetPreview>;
    if (
      value.version !== VFX_PRESET_PREVIEW_CACHE_VERSION ||
      value.cacheKey !== preset.metadata.thumbnail.cacheKey ||
      typeof value.dataUrl !== "string" ||
      !value.dataUrl.startsWith("data:image/svg+xml;charset=utf-8,") ||
      value.dataUrl.length > MAX_VFX_PRESET_PREVIEW_DATA_URL_LENGTH
    ) return null;
    return value as CachedVfxPresetPreview;
  } catch {
    return null;
  }
}

export function writeCachedVfxPresetPreview(
  storage: Pick<Storage, "setItem">,
  preset: BuiltinVfxPreset,
  dataUrl: string
): boolean {
  if (
    preset.metadata.thumbnail.kind !== "generated" ||
    !dataUrl.startsWith("data:image/svg+xml;charset=utf-8,") ||
    dataUrl.length > MAX_VFX_PRESET_PREVIEW_DATA_URL_LENGTH
  ) return false;
  try {
    storage.setItem(storageKey(preset.metadata.thumbnail.cacheKey), JSON.stringify({
      version: VFX_PRESET_PREVIEW_CACHE_VERSION,
      cacheKey: preset.metadata.thumbnail.cacheKey,
      dataUrl
    } satisfies CachedVfxPresetPreview));
    return true;
  } catch {
    return false;
  }
}

export const scheduleVfxPreviewIdle: VfxPreviewScheduler = (callback) => {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout: 500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(callback, 0);
  return () => globalThis.clearTimeout(id);
};

export function scheduleBuiltinVfxPresetPreviews(
  presets: readonly BuiltinVfxPreset[],
  storage: Pick<Storage, "getItem" | "setItem">,
  onReady: (presetId: string, dataUrl: string) => void,
  scheduler: VfxPreviewScheduler = scheduleVfxPreviewIdle
): () => void {
  const queue = presets.filter(
    (preset) => preset.metadata.compatibility.runtime === "native-primitives"
  );
  let cancelled = false;
  let cancelScheduled: (() => void) | null = null;
  const next = () => {
    if (cancelled) return;
    const preset = queue.shift();
    if (!preset) return;
    const cached = readCachedVfxPresetPreview(storage, preset);
    if (cached) {
      onReady(preset.metadata.id, cached.dataUrl);
    } else {
      try {
        const dataUrl = generateVfxPresetPreviewDataUrl(preset);
        writeCachedVfxPresetPreview(storage, preset, dataUrl);
        onReady(preset.metadata.id, dataUrl);
      } catch {
        // Keep the catalog usable and retry generation on the next application run.
      }
    }
    cancelScheduled = scheduler(next);
  };
  cancelScheduled = scheduler(next);
  return () => {
    cancelled = true;
    cancelScheduled?.();
  };
}
