import { createId } from "../core/ids/Id";
import { createDefaultExportSettings, sanitizeOutputName } from "../export/ExportSettings";
import type { MineMotionProject } from "../project/ProjectFile";
import { withPostProcessingDefaults } from "../rendering/postprocessing/PostProcessingPresets";
import {
  DEFAULT_SHOT_PRODUCTION,
  REAL_RENDER_PASSES,
  SHOT_STATUSES,
  type ProductionShot,
  type RenderPassId,
  type ShotCreativeVariant,
  type ShotProductionData,
  type ShotReferenceImage,
  type ShotStatus,
  type StoryboardCard
} from "./ShotTypes";

const IMAGE_DATA_LIMIT = 2 * 1024 * 1024;

export function createProductionShot(
  project: MineMotionProject,
  options: Partial<ProductionShot> = {}
): ProductionShot {
  const now = new Date().toISOString();
  const index = project.production.shots.length + 1;
  const name = options.name?.trim() || `SH${String(index * 10).padStart(3, "0")}`;
  const startFrame = clampFrame(options.startFrame ?? project.animation.currentFrame, project);
  const endFrame = Math.max(startFrame, clampFrame(options.endFrame ?? Math.min(project.animation.durationFrames, startFrame + project.animation.fps * 5 - 1), project));
  const cameraId = resolveCameraId(project, options.cameraId);
  const renderPreset = {
    ...createDefaultExportSettings(project),
    ...options.renderPreset,
    startFrame,
    endFrame,
    cameraId,
    outputName: sanitizeOutputName(options.outputName ?? name)
  };
  const takeGroupId = options.takeGroupId || createId("take_group");
  const creativeVariants = sanitizeCreativeVariants(options.creativeVariants, project, cameraId);
  const activeVariantId = typeof options.activeVariantId === "string" && creativeVariants.some((variant) => variant.id === options.activeVariantId)
    ? options.activeVariantId
    : null;
  return {
    id: options.id || createId("shot"),
    takeGroupId,
    name,
    startFrame,
    endFrame,
    cameraId,
    status: sanitizeShotStatus(options.status),
    notes: options.notes ?? "",
    thumbnail: sanitizeReferenceImage(options.thumbnail),
    referenceImages: sanitizeReferenceImages(options.referenceImages),
    renderPreset,
    renderPasses: sanitizeRenderPasses(options.renderPasses),
    postProcessingOverride: options.postProcessingOverride ? withPostProcessingDefaults(options.postProcessingOverride) : undefined,
    outputName: sanitizeOutputName(options.outputName ?? name),
    outputFolder: sanitizeOutputFolder(options.outputFolder ?? name),
    enabled: options.enabled ?? true,
    takeNumber: Math.max(1, Math.round(options.takeNumber ?? 1)),
    revision: Math.max(1, Math.round(options.revision ?? 1)),
    activeTake: options.activeTake ?? true,
    approved: options.approved ?? false,
    rating: clampRating(options.rating),
    favorite: options.favorite ?? false,
    rejected: options.rejected ?? false,
    reviewNotes: typeof options.reviewNotes === "string" ? options.reviewNotes : "",
    reviewTags: sanitizeReviewTags(options.reviewTags),
    creativeVariants,
    activeVariantId,
    validation: options.validation ?? {
      valid: false,
      errors: [],
      warnings: ["Shot has not been validated yet."],
      checkedAt: ""
    },
    createdAt: options.createdAt ?? now,
    updatedAt: now
  };
}

export function duplicateShotAsTake(
  production: ShotProductionData,
  shotId: string,
  now = new Date().toISOString()
): ShotProductionData {
  const source = production.shots.find((shot) => shot.id === shotId);
  if (!source) return production;
  const group = production.shots.filter((shot) => shot.takeGroupId === source.takeGroupId);
  const nextTake = Math.max(...group.map((shot) => shot.takeNumber), 0) + 1;
  const clone: ProductionShot = {
    ...source,
    id: createId("shot"),
    name: `${source.name} Take ${nextTake}`,
    takeNumber: nextTake,
    revision: 1,
    activeTake: true,
    approved: false,
    rating: 0,
    favorite: false,
    rejected: false,
    reviewNotes: "",
    reviewTags: [],
    creativeVariants: [],
    activeVariantId: null,
    status: "planned",
    validation: {
      valid: false,
      errors: [],
      warnings: ["New take requires validation."],
      checkedAt: ""
    },
    referenceImages: source.referenceImages.map((image) => ({ ...image })),
    renderPreset: { ...source.renderPreset },
    createdAt: now,
    updatedAt: now
  };
  return setActiveTake(
    {
      ...production,
      shots: [...production.shots, clone],
      activeShotId: clone.id
    },
    clone.id
  );
}

export function setActiveTake(
  production: ShotProductionData,
  shotId: string
): ShotProductionData {
  const selected = production.shots.find((shot) => shot.id === shotId);
  if (!selected) return production;
  return {
    ...production,
    activeShotId: selected.id,
    shots: production.shots.map((shot) =>
      shot.takeGroupId === selected.takeGroupId
        ? { ...shot, activeTake: shot.id === selected.id }
        : shot
    )
  };
}

export function updateShot(
  production: ShotProductionData,
  shotId: string,
  patch: Partial<ProductionShot>
): ShotProductionData {
  return {
    ...production,
    shots: production.shots.map((shot) =>
      shot.id === shotId
        ? {
            ...shot,
            ...patch,
            renderPasses: patch.renderPasses
              ? sanitizeRenderPasses(patch.renderPasses)
              : shot.renderPasses,
            outputName: patch.outputName
              ? sanitizeOutputName(patch.outputName)
              : shot.outputName,
            outputFolder: patch.outputFolder
              ? sanitizeOutputFolder(patch.outputFolder)
              : shot.outputFolder,
            updatedAt: new Date().toISOString()
          }
        : shot
    )
  };
}

export function reorderShots(
  production: ShotProductionData,
  shotId: string,
  direction: -1 | 1
): ShotProductionData {
  const shots = [...production.shots];
  const index = shots.findIndex((shot) => shot.id === shotId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= shots.length) return production;
  [shots[index], shots[target]] = [shots[target], shots[index]];
  return { ...production, shots };
}

export function removeShot(
  production: ShotProductionData,
  shotId: string
): ShotProductionData {
  const shots = production.shots.filter((shot) => shot.id !== shotId);
  return {
    ...production,
    shots,
    activeShotId:
      production.activeShotId === shotId ? shots[0]?.id ?? null : production.activeShotId,
    storyboard: production.storyboard.map((card) =>
      card.shotId === shotId ? { ...card, shotId: null } : card
    )
  };
}

export function createStoryboardCard(
  shot: ProductionShot | null,
  fps: number
): StoryboardCard {
  return {
    id: createId("storyboard"),
    shotId: shot?.id ?? null,
    title: shot?.name ?? "Storyboard card",
    notes: shot?.notes ?? "",
    durationFrames: shot ? shot.endFrame - shot.startFrame + 1 : Math.max(1, fps * 5),
    cameraId: shot?.cameraId ?? "",
    status: shot?.status ?? "planned",
    referenceImage: shot?.referenceImages[0]
  };
}

export function sanitizeProductionData(
  value: unknown,
  project: MineMotionProject
): ShotProductionData {
  if (!value || typeof value !== "object") return { ...DEFAULT_SHOT_PRODUCTION };
  const source = value as Partial<ShotProductionData>;
  const shell = { ...project, production: { ...DEFAULT_SHOT_PRODUCTION } };
  const shots = Array.isArray(source.shots)
    ? source.shots.flatMap((shot) => {
        if (!shot || typeof shot !== "object") return [];
        return [createProductionShot(shell, shot as Partial<ProductionShot>)];
      })
    : [];
  const knownIds = new Set(shots.map((shot) => shot.id));
  const storyboard = Array.isArray(source.storyboard)
    ? source.storyboard.flatMap((card, index) => sanitizeStoryboardCard(card, index, knownIds))
    : [];
  return {
    shots,
    storyboard,
    activeShotId:
      typeof source.activeShotId === "string" && knownIds.has(source.activeShotId)
        ? source.activeShotId
        : shots.find((shot) => shot.activeTake)?.id ?? shots[0]?.id ?? null,
    handoffRoot: sanitizeOutputFolder(source.handoffRoot ?? "ProjectExports"),
    namingPattern:
      typeof source.namingPattern === "string" && source.namingPattern.trim()
        ? source.namingPattern.trim()
        : DEFAULT_SHOT_PRODUCTION.namingPattern
  };
}


function sanitizeCreativeVariants(value: unknown, project: MineMotionProject, cameraId: string): ShotCreativeVariant[] {
  if (!Array.isArray(value)) return [];
  const fallbackCamera = project.scene.cameras.find((camera) => camera.id === cameraId) ?? project.scene.cameras[0];
  if (!fallbackCamera) return [];
  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];
    const source = entry as Partial<ShotCreativeVariant>;
    const cameraSource = source.camera && typeof source.camera === "object" ? source.camera : undefined;
    const camera = {
      transform: sanitizeTransform(cameraSource?.transform, fallbackCamera.transform),
      fov: finiteNumber(cameraSource?.fov, fallbackCamera.fov),
      focalLength: finiteNumber(cameraSource?.focalLength, fallbackCamera.focalLength),
      near: Math.max(0.001, finiteNumber(cameraSource?.near, fallbackCamera.near)),
      far: Math.max(1, finiteNumber(cameraSource?.far, fallbackCamera.far)),
      metadata: sanitizeMetadata(cameraSource?.metadata)
    };
    const lights = Array.isArray(source.lights) ? source.lights.slice(0, 32).flatMap((light, lightIndex) => {
      if (!light || typeof light !== "object") return [];
      const record = light as ShotCreativeVariant["lights"][number];
      return [{
        id: typeof record.id === "string" && record.id ? record.id : `variant_light_${index}_${lightIndex}`,
        name: typeof record.name === "string" && record.name.trim() ? record.name.trim() : `Variant light ${lightIndex + 1}`,
        transform: sanitizeTransform(record.transform, fallbackCamera.transform),
        visible: record.visible !== false,
        intensity: Math.max(0, finiteNumber(record.intensity, 1)),
        color: typeof record.color === "string" && record.color.trim() ? record.color : "#ffffff",
        metadata: sanitizeMetadata(record.metadata)
      }];
    }) : [];
    const now = new Date().toISOString();
    return [{
      id: typeof source.id === "string" && source.id ? source.id : `shot_variant_${index}`,
      name: typeof source.name === "string" && source.name.trim() ? source.name.trim().slice(0, 80) : `Variant ${index + 1}`,
      notes: typeof source.notes === "string" ? source.notes.slice(0, 2000) : "",
      rating: clampRating(source.rating),
      camera,
      lighting: source.lighting && typeof source.lighting === "object" ? cloneJson(source.lighting) : cloneJson(project.lighting),
      lights,
      postProcessing: withPostProcessingDefaults(source.postProcessing),
      renderPasses: sanitizeRenderPasses(source.renderPasses),
      createdAt: typeof source.createdAt === "string" ? source.createdAt : now,
      updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : now
    }];
  }).slice(0, 32);
}

function sanitizeTransform(value: unknown, fallback: MineMotionProject["scene"]["cameras"][number]["transform"]) {
  if (!value || typeof value !== "object") return { position: [...fallback.position], rotation: [...fallback.rotation], scale: [...fallback.scale] } as typeof fallback;
  const source = value as Partial<typeof fallback>;
  return {
    position: sanitizeVector(source.position, fallback.position),
    rotation: sanitizeVector(source.rotation, fallback.rotation),
    scale: sanitizeVector(source.scale, fallback.scale)
  };
}

function sanitizeVector(value: unknown, fallback: [number, number, number]): [number, number, number] {
  if (!Array.isArray(value) || value.length < 3) return [...fallback];
  return [finiteNumber(value[0], fallback[0]), finiteNumber(value[1], fallback[1]), finiteNumber(value[2], fallback[2])];
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? cloneJson(value as Record<string, unknown>) : {};
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clampRating(value: unknown): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(5, Math.round(numeric * 2) / 2));
}

function sanitizeReviewTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 16);
  return [...new Set(tags)];
}

export function sanitizeReferenceImage(
  value: ShotReferenceImage | undefined
): ShotReferenceImage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const mimeType = value.mimeType;
  if (!(["image/png", "image/jpeg", "image/webp"] as const).includes(mimeType)) {
    return undefined;
  }
  if (typeof value.dataUrl !== "string" || !value.dataUrl.startsWith(`data:${mimeType};base64,`)) {
    return undefined;
  }
  if (value.dataUrl.length > IMAGE_DATA_LIMIT) return undefined;
  return {
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : "reference",
    mimeType,
    dataUrl: value.dataUrl
  };
}

function sanitizeReferenceImages(values: ShotReferenceImage[] | undefined): ShotReferenceImage[] {
  if (!Array.isArray(values)) return [];
  return values.flatMap((value) => {
    const image = sanitizeReferenceImage(value);
    return image ? [image] : [];
  }).slice(0, 12);
}

function sanitizeStoryboardCard(
  value: unknown,
  index: number,
  knownShotIds: Set<string>
): StoryboardCard[] {
  if (!value || typeof value !== "object") return [];
  const source = value as Partial<StoryboardCard>;
  return [{
    id: typeof source.id === "string" && source.id ? source.id : `storyboard_${index}`,
    shotId: typeof source.shotId === "string" && knownShotIds.has(source.shotId) ? source.shotId : null,
    title: typeof source.title === "string" && source.title.trim() ? source.title.trim() : "Storyboard card",
    notes: typeof source.notes === "string" ? source.notes : "",
    durationFrames: Math.max(1, Math.round(Number(source.durationFrames) || 1)),
    cameraId: typeof source.cameraId === "string" ? source.cameraId : "",
    status: sanitizeShotStatus(source.status),
    referenceImage: sanitizeReferenceImage(source.referenceImage)
  }];
}

function sanitizeRenderPasses(values: RenderPassId[] | undefined): RenderPassId[] {
  if (!Array.isArray(values)) return ["beauty"];
  const passes = [...new Set(values.filter((value): value is RenderPassId =>
    (REAL_RENDER_PASSES as readonly string[]).includes(value)
  ))];
  return passes.length > 0 ? passes : ["beauty"];
}

function sanitizeShotStatus(value: ShotStatus | undefined): ShotStatus {
  return (SHOT_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as ShotStatus)
    : "planned";
}

function sanitizeOutputFolder(value: string): string {
  return value
    .trim()
    .replace(/[\\:*?"<>|]+/g, "-")
    .replace(/\.\.+/g, ".")
    .replace(/^[/\\]+|[/\\]+$/g, "") || "shot";
}

function clampFrame(frame: number, project: MineMotionProject): number {
  return Math.min(project.animation.durationFrames, Math.max(0, Math.round(Number(frame) || 0)));
}

function resolveCameraId(project: MineMotionProject, requested?: string): string {
  const resolved = requested === "active" || !requested ? project.activeCameraId : requested;
  return project.scene.cameras.some((camera) => camera.id === resolved)
    ? resolved
    : project.scene.cameras[0]?.id ?? "";
}
