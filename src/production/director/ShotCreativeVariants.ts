import { createId } from "../../core/ids/Id";
import type { MineMotionProject } from "../../project/ProjectFile";
import type { ProductionShot, ShotCreativeVariant } from "../ShotTypes";

export interface ShotVariantMutation {
  project: MineMotionProject;
  changed: boolean;
  shotId: string | null;
  variantId: string | null;
  error: string | null;
}

export interface ShotVariantComparison {
  id: string;
  name: string;
  rating: number;
  active: boolean;
  focalLength: number;
  lightCount: number;
  renderPassCount: number;
  notes: string;
  updatedAt: string;
}

export function captureShotCreativeVariant(
  project: MineMotionProject,
  shotId: string,
  name = "Creative variant"
): ShotVariantMutation {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  const camera = shot ? project.scene.cameras.find((candidate) => candidate.id === shot.cameraId) : null;
  if (!shot || !camera) return failure(project, shotId, null, "SHOT_CAMERA_MISSING");
  if (shot.creativeVariants.length >= 32) return failure(project, shotId, null, "VARIANT_LIMIT_REACHED");
  const variant = snapshotVariant(project, shot, camera, createId("shot_variant"), uniqueVariantName(shot, name));
  const shots = project.production.shots.map((candidate) => candidate.id === shotId ? {
    ...candidate,
    creativeVariants: [...candidate.creativeVariants, variant],
    activeVariantId: variant.id,
    updatedAt: variant.updatedAt
  } : candidate);
  return success({ ...project, production: { ...project.production, shots } }, shotId, variant.id);
}

export function updateShotCreativeVariant(
  project: MineMotionProject,
  shotId: string,
  variantId: string
): ShotVariantMutation {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  const camera = shot ? project.scene.cameras.find((candidate) => candidate.id === shot.cameraId) : null;
  const existing = shot?.creativeVariants.find((variant) => variant.id === variantId);
  if (!shot || !camera || !existing) return failure(project, shotId, variantId, "VARIANT_MISSING");
  const snapshot = snapshotVariant(project, shot, camera, existing.id, existing.name, existing);
  const shots = project.production.shots.map((candidate) => candidate.id === shotId ? {
    ...candidate,
    creativeVariants: candidate.creativeVariants.map((variant) => variant.id === variantId ? snapshot : variant),
    activeVariantId: variantId,
    updatedAt: snapshot.updatedAt
  } : candidate);
  return success({ ...project, production: { ...project.production, shots } }, shotId, variantId);
}

export function applyShotCreativeVariant(
  project: MineMotionProject,
  shotId: string,
  variantId: string
): ShotVariantMutation {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  const variant = shot?.creativeVariants.find((candidate) => candidate.id === variantId);
  if (!shot || !variant) return failure(project, shotId, variantId, "VARIANT_MISSING");
  const cameraExists = project.scene.cameras.some((camera) => camera.id === shot.cameraId);
  if (!cameraExists) return failure(project, shotId, variantId, "SHOT_CAMERA_MISSING");
  const now = new Date().toISOString();
  const cameras = project.scene.cameras.map((camera) => camera.id === shot.cameraId ? {
    ...camera,
    transform: clone(variant.camera.transform),
    fov: variant.camera.fov,
    focalLength: variant.camera.focalLength,
    near: variant.camera.near,
    far: variant.camera.far,
    metadata: clone(variant.camera.metadata)
  } : camera);
  const lights = variant.lights.map((light) => ({
    id: light.id,
    type: "light" as const,
    name: light.name,
    transform: clone(light.transform),
    visible: light.visible,
    locked: false,
    metadata: clone(light.metadata),
    intensity: light.intensity,
    color: light.color
  }));
  const shots = project.production.shots.map((candidate) => candidate.id === shotId ? {
    ...candidate,
    renderPasses: [...variant.renderPasses],
    postProcessingOverride: clone(variant.postProcessing),
    activeVariantId: variantId,
    revision: candidate.revision + 1,
    updatedAt: now
  } : candidate);
  return success({
    ...project,
    scene: { ...project.scene, cameras, lights },
    lighting: clone(variant.lighting),
    postProcessing: clone(variant.postProcessing),
    production: { ...project.production, shots },
    metadata: { ...project.metadata, updatedAt: now }
  }, shotId, variantId);
}

export function duplicateShotCreativeVariant(
  project: MineMotionProject,
  shotId: string,
  variantId: string
): ShotVariantMutation {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  const source = shot?.creativeVariants.find((variant) => variant.id === variantId);
  if (!shot || !source) return failure(project, shotId, variantId, "VARIANT_MISSING");
  if (shot.creativeVariants.length >= 32) return failure(project, shotId, variantId, "VARIANT_LIMIT_REACHED");
  const now = new Date().toISOString();
  const cloneVariant: ShotCreativeVariant = {
    ...clone(source),
    id: createId("shot_variant"),
    name: uniqueVariantName(shot, `${source.name} Copy`),
    rating: 0,
    createdAt: now,
    updatedAt: now
  };
  const shots = project.production.shots.map((candidate) => candidate.id === shotId ? {
    ...candidate,
    creativeVariants: [...candidate.creativeVariants, cloneVariant],
    activeVariantId: cloneVariant.id,
    updatedAt: now
  } : candidate);
  return success({ ...project, production: { ...project.production, shots } }, shotId, cloneVariant.id);
}

export function renameShotCreativeVariant(project: MineMotionProject, shotId: string, variantId: string, name: string): ShotVariantMutation {
  return patchVariant(project, shotId, variantId, (shot, variant) => ({ ...variant, name: uniqueVariantName(shot, name, variant.id), updatedAt: new Date().toISOString() }));
}

export function annotateShotCreativeVariant(project: MineMotionProject, shotId: string, variantId: string, notes: string): ShotVariantMutation {
  return patchVariant(project, shotId, variantId, (_shot, variant) => ({ ...variant, notes: notes.trim().slice(0, 2000), updatedAt: new Date().toISOString() }));
}

export function rateShotCreativeVariant(project: MineMotionProject, shotId: string, variantId: string, rating: number): ShotVariantMutation {
  return patchVariant(project, shotId, variantId, (_shot, variant) => ({ ...variant, rating: clampRating(rating), updatedAt: new Date().toISOString() }));
}

export function chooseHighestRatedShotVariant(project: MineMotionProject, shotId: string): ShotVariantMutation {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot || shot.creativeVariants.length === 0) return failure(project, shotId, null, "NO_VARIANTS");
  const best = [...shot.creativeVariants].sort((a, b) => b.rating - a.rating || b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name))[0];
  return applyShotCreativeVariant(project, shotId, best.id);
}

export function compareShotCreativeVariants(project: MineMotionProject, shotId: string): ShotVariantComparison[] {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return [];
  return shot.creativeVariants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    rating: variant.rating,
    active: shot.activeVariantId === variant.id,
    focalLength: variant.camera.focalLength,
    lightCount: variant.lights.filter((light) => light.visible && light.intensity > 0).length,
    renderPassCount: variant.renderPasses.length,
    notes: variant.notes,
    updatedAt: variant.updatedAt
  })).sort((a, b) => Number(b.active) - Number(a.active) || b.rating - a.rating || a.name.localeCompare(b.name));
}

export function deleteShotCreativeVariant(project: MineMotionProject, shotId: string, variantId: string): ShotVariantMutation {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot || !shot.creativeVariants.some((variant) => variant.id === variantId)) return failure(project, shotId, variantId, "VARIANT_MISSING");
  const now = new Date().toISOString();
  const shots = project.production.shots.map((candidate) => candidate.id === shotId ? {
    ...candidate,
    creativeVariants: candidate.creativeVariants.filter((variant) => variant.id !== variantId),
    activeVariantId: candidate.activeVariantId === variantId ? null : candidate.activeVariantId,
    updatedAt: now
  } : candidate);
  return success({ ...project, production: { ...project.production, shots } }, shotId, variantId);
}

export function createShotVariantManifest(project: MineMotionProject, shotId: string): string {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return JSON.stringify({ schemaVersion: 1, shotId, variants: [] }, null, 2);
  return JSON.stringify({
    schemaVersion: 1,
    projectName: project.projectName,
    shot: { id: shot.id, name: shot.name, takeNumber: shot.takeNumber, revision: shot.revision },
    activeVariantId: shot.activeVariantId,
    variants: compareShotCreativeVariants(project, shotId)
  }, null, 2);
}

function patchVariant(
  project: MineMotionProject,
  shotId: string,
  variantId: string,
  transform: (shot: ProductionShot, variant: ShotCreativeVariant) => ShotCreativeVariant
): ShotVariantMutation {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot || !shot.creativeVariants.some((variant) => variant.id === variantId)) return failure(project, shotId, variantId, "VARIANT_MISSING");
  const now = new Date().toISOString();
  const shots = project.production.shots.map((candidate) => candidate.id === shotId ? {
    ...candidate,
    creativeVariants: candidate.creativeVariants.map((variant) => variant.id === variantId ? transform(candidate, variant) : variant),
    updatedAt: now
  } : candidate);
  return success({ ...project, production: { ...project.production, shots } }, shotId, variantId);
}

function snapshotVariant(
  project: MineMotionProject,
  shot: ProductionShot,
  camera: MineMotionProject["scene"]["cameras"][number],
  id: string,
  name: string,
  existing?: ShotCreativeVariant
): ShotCreativeVariant {
  const now = new Date().toISOString();
  return {
    id,
    name,
    notes: existing?.notes ?? "",
    rating: existing?.rating ?? 0,
    camera: {
      transform: clone(camera.transform),
      fov: camera.fov,
      focalLength: camera.focalLength,
      near: camera.near,
      far: camera.far,
      metadata: clone(camera.metadata)
    },
    lighting: clone(project.lighting),
    lights: project.scene.lights.slice(0, 32).map((light) => ({
      id: light.id,
      name: light.name,
      transform: clone(light.transform),
      visible: light.visible,
      intensity: light.intensity,
      color: light.color,
      metadata: clone(light.metadata)
    })),
    postProcessing: clone(project.postProcessing),
    renderPasses: [...shot.renderPasses],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function uniqueVariantName(shot: ProductionShot, value: string, ignoredId?: string): string {
  const base = value.trim().slice(0, 80) || "Creative variant";
  const used = new Set(shot.creativeVariants.filter((variant) => variant.id !== ignoredId).map((variant) => variant.name.toLowerCase()));
  if (!used.has(base.toLowerCase())) return base;
  let index = 2;
  while (used.has(`${base} ${index}`.toLowerCase())) index += 1;
  return `${base} ${index}`;
}

function clampRating(value: number): number {
  return Math.max(0, Math.min(5, Math.round((Number.isFinite(value) ? value : 0) * 2) / 2));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function success(project: MineMotionProject, shotId: string, variantId: string): ShotVariantMutation {
  return { project, changed: true, shotId, variantId, error: null };
}

function failure(project: MineMotionProject, shotId: string | null, variantId: string | null, error: string): ShotVariantMutation {
  return { project, changed: false, shotId, variantId, error };
}
