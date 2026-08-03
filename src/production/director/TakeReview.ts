import type { MineMotionProject } from "../../project/ProjectFile";
import type { ProductionShot } from "../ShotTypes";
import { setActiveTake } from "../ShotManager";

export interface TakeReviewResult {
  project: MineMotionProject;
  changed: boolean;
  shotId: string;
  error: string | null;
}

export interface TakeComparisonRow {
  shotId: string;
  name: string;
  takeNumber: number;
  revision: number;
  rating: number;
  favorite: boolean;
  rejected: boolean;
  approved: boolean;
  status: ProductionShot["status"];
  durationFrames: number;
  cameraId: string;
  notes: string;
}

export function rateTake(project: MineMotionProject, shotId: string, rating: number): TakeReviewResult {
  return patchTake(project, shotId, { rating: clampRating(rating) });
}

export function toggleFavoriteTake(project: MineMotionProject, shotId: string): TakeReviewResult {
  const shot = findShot(project, shotId);
  return shot ? patchTake(project, shotId, { favorite: !shot.favorite }) : failure(project, shotId, "TAKE_MISSING");
}

export function rejectTake(project: MineMotionProject, shotId: string, reason = ""): TakeReviewResult {
  return patchTake(project, shotId, {
    rejected: true,
    favorite: false,
    approved: false,
    status: "blocked",
    reviewNotes: mergeNote(findShot(project, shotId)?.reviewNotes ?? "", reason)
  });
}

export function restoreRejectedTake(project: MineMotionProject, shotId: string): TakeReviewResult {
  return patchTake(project, shotId, { rejected: false, status: "review" });
}

export function approveTake(project: MineMotionProject, shotId: string): TakeReviewResult {
  const shot = findShot(project, shotId);
  if (!shot) return failure(project, shotId, "TAKE_MISSING");
  const production = setActiveTake({
    ...project.production,
    shots: project.production.shots.map((candidate) => candidate.takeGroupId === shot.takeGroupId ? {
      ...candidate,
      approved: candidate.id === shot.id,
      rejected: candidate.id === shot.id ? false : candidate.rejected,
      status: candidate.id === shot.id ? "approved" as const : candidate.status,
      updatedAt: new Date().toISOString()
    } : candidate)
  }, shot.id);
  return success({ ...project, production }, shotId);
}

export function chooseHighestRatedTake(project: MineMotionProject, takeGroupId: string): TakeReviewResult {
  const group = project.production.shots.filter((shot) => shot.takeGroupId === takeGroupId && !shot.rejected);
  if (group.length === 0) return failure(project, "", "TAKE_GROUP_EMPTY");
  const best = [...group].sort((a, b) =>
    Number(b.favorite) - Number(a.favorite) ||
    b.rating - a.rating ||
    Number(b.approved) - Number(a.approved) ||
    b.revision - a.revision ||
    a.takeNumber - b.takeNumber
  )[0];
  return success({ ...project, production: setActiveTake(project.production, best.id) }, best.id);
}

export function addTakeReviewNote(project: MineMotionProject, shotId: string, note: string): TakeReviewResult {
  const shot = findShot(project, shotId);
  if (!shot) return failure(project, shotId, "TAKE_MISSING");
  const trimmed = note.trim();
  if (!trimmed) return failure(project, shotId, "TAKE_NOTE_EMPTY");
  return patchTake(project, shotId, { reviewNotes: mergeNote(shot.reviewNotes, trimmed) });
}

export function addTakeReviewTag(project: MineMotionProject, shotId: string, tag: string): TakeReviewResult {
  const shot = findShot(project, shotId);
  if (!shot) return failure(project, shotId, "TAKE_MISSING");
  const normalized = normalizeTag(tag);
  if (!normalized) return failure(project, shotId, "TAKE_TAG_EMPTY");
  return patchTake(project, shotId, { reviewTags: [...new Set([...shot.reviewTags, normalized])].slice(0, 16) });
}

export function removeTakeReviewTag(project: MineMotionProject, shotId: string, tag: string): TakeReviewResult {
  const shot = findShot(project, shotId);
  if (!shot) return failure(project, shotId, "TAKE_MISSING");
  const normalized = normalizeTag(tag);
  return patchTake(project, shotId, { reviewTags: shot.reviewTags.filter((value) => value !== normalized) });
}

export function createTakeRevision(project: MineMotionProject, shotId: string): TakeReviewResult {
  const shot = findShot(project, shotId);
  if (!shot) return failure(project, shotId, "TAKE_MISSING");
  return patchTake(project, shotId, {
    revision: shot.revision + 1,
    approved: false,
    status: "review",
    validation: {
      valid: false,
      errors: [],
      warnings: ["Revision changed and requires validation."],
      checkedAt: ""
    }
  });
}

export function normalizeTakeNames(project: MineMotionProject, takeGroupId: string): TakeReviewResult {
  const group = project.production.shots.filter((shot) => shot.takeGroupId === takeGroupId);
  if (group.length === 0) return failure(project, "", "TAKE_GROUP_EMPTY");
  const base = group[0].name.replace(/(?:\s+Take\s+\d+|\s+T\d+)$/i, "").trim() || "Shot";
  const shots = project.production.shots.map((shot) => shot.takeGroupId === takeGroupId ? {
    ...shot,
    name: `${base} T${String(shot.takeNumber).padStart(2, "0")}`,
    outputName: `${sanitizeName(base)}_T${String(shot.takeNumber).padStart(2, "0")}`,
    updatedAt: new Date().toISOString()
  } : shot);
  return success({ ...project, production: { ...project.production, shots } }, group[0].id);
}

export function compareTakeGroup(project: MineMotionProject, takeGroupId: string): TakeComparisonRow[] {
  return project.production.shots
    .filter((shot) => shot.takeGroupId === takeGroupId)
    .map((shot) => ({
      shotId: shot.id,
      name: shot.name,
      takeNumber: shot.takeNumber,
      revision: shot.revision,
      rating: shot.rating,
      favorite: shot.favorite,
      rejected: shot.rejected,
      approved: shot.approved,
      status: shot.status,
      durationFrames: shot.endFrame - shot.startFrame + 1,
      cameraId: shot.cameraId,
      notes: shot.reviewNotes
    }))
    .sort((a, b) => a.takeNumber - b.takeNumber || b.revision - a.revision);
}

function patchTake(project: MineMotionProject, shotId: string, patch: Partial<ProductionShot>): TakeReviewResult {
  const shot = findShot(project, shotId);
  if (!shot) return failure(project, shotId, "TAKE_MISSING");
  const next = {
    ...project,
    production: {
      ...project.production,
      shots: project.production.shots.map((candidate) => candidate.id === shotId ? {
        ...candidate,
        ...patch,
        updatedAt: new Date().toISOString()
      } : candidate)
    },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
  return success(next, shotId);
}

function findShot(project: MineMotionProject, shotId: string): ProductionShot | undefined {
  return project.production.shots.find((shot) => shot.id === shotId);
}

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value * 2) / 2));
}

function mergeNote(previous: string, next: string): string {
  const trimmed = next.trim();
  if (!trimmed) return previous;
  return previous.trim() ? `${previous.trim()}\n${trimmed}` : trimmed;
}

function normalizeTag(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

function sanitizeName(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "") || "Shot";
}

function success(project: MineMotionProject, shotId: string): TakeReviewResult {
  return { project, changed: true, shotId, error: null };
}

function failure(project: MineMotionProject, shotId: string, error: string): TakeReviewResult {
  return { project, changed: false, shotId, error };
}
