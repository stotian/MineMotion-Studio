import { Animator } from "../../animation/Animator";
import type { AnimationTrack, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { analyzeCollisions, resolveEntityCollisions } from "./CollisionStudio";

export interface CollisionTimelineFrame {
  frame: number;
  contacts: number;
  entityContacts: number;
  worldContacts: number;
  entityIds: string[];
}

export interface CollisionTimelineReport {
  startFrame: number;
  endFrame: number;
  stepFrames: number;
  sampledFrames: number;
  collisionFrames: CollisionTimelineFrame[];
  peakContacts: number;
  affectedEntityIds: string[];
  warnings: string[];
}

export interface CollisionBakeResult {
  project: MineMotionProject;
  changed: boolean;
  bakedFrames: number;
  affectedTrackIds: string[];
  report: CollisionTimelineReport;
}

export function analyzeCollisionTimeline(
  project: MineMotionProject,
  startFrame = 0,
  endFrame = project.animation.durationFrames,
  stepFrames = Math.max(1, Math.round(project.animation.fps / 2))
): CollisionTimelineReport {
  const start = Math.max(0, Math.round(startFrame));
  const end = Math.max(start, Math.min(project.animation.durationFrames, Math.round(endFrame)));
  const step = Math.max(1, Math.min(240, Math.round(stepFrames)));
  const collisionFrames: CollisionTimelineFrame[] = [];
  let sampledFrames = 0;
  let peakContacts = 0;
  const affected = new Set<string>();
  if (!project.creationSuite.collisions.enabled) {
    return { startFrame: start, endFrame: end, stepFrames: step, sampledFrames: 0, collisionFrames: [], peakContacts: 0, affectedEntityIds: [], warnings: ["Collision Studio is disabled."] };
  }
  for (let frame = start; frame <= end; frame += step) {
    const sampled = Animator.sampleProject(project, frame);
    const analysis = analyzeCollisions(sampled);
    sampledFrames += 1;
    if (analysis.contacts.length === 0) continue;
    const ids = [...new Set(analysis.contacts.flatMap((contact) => [contact.entityAId, contact.entityBId].filter((value): value is string => Boolean(value))))];
    ids.forEach((id) => affected.add(id));
    const entityContacts = analysis.contacts.filter((contact) => Boolean(contact.entityBId)).length;
    const worldContacts = analysis.contacts.length - entityContacts;
    peakContacts = Math.max(peakContacts, analysis.contacts.length);
    collisionFrames.push({ frame, contacts: analysis.contacts.length, entityContacts, worldContacts, entityIds: ids });
  }
  const warnings: string[] = [];
  if (collisionFrames.length > sampledFrames * 0.35) warnings.push("Collisions affect more than 35% of sampled frames; review formation spacing or animation paths.");
  if (peakContacts > 16) warnings.push("High collision density detected; bake smaller groups or increase sample frequency.");
  return { startFrame: start, endFrame: end, stepFrames: step, sampledFrames, collisionFrames, peakContacts, affectedEntityIds: [...affected], warnings };
}

export function bakeCollisionAvoidance(
  project: MineMotionProject,
  startFrame = 0,
  endFrame = project.animation.durationFrames,
  stepFrames = Math.max(1, Math.round(project.animation.fps / 2))
): CollisionBakeResult {
  const report = analyzeCollisionTimeline(project, startFrame, endFrame, stepFrames);
  if (report.collisionFrames.length === 0) return { project, changed: false, bakedFrames: 0, affectedTrackIds: [], report };
  let tracks = [...project.animation.tracks];
  const affectedTrackIds = new Set<string>();
  let bakedFrames = 0;
  for (const frameReport of report.collisionFrames) {
    const sampled = Animator.sampleProject(project, frameReport.frame);
    const resolved = resolveEntityCollisions(sampled, 8);
    let changedAtFrame = false;
    for (const characterId of frameReport.entityIds) {
      const before = sampled.scene.characters.find((entry) => entry.id === characterId);
      const after = resolved.scene.characters.find((entry) => entry.id === characterId);
      if (!before || !after || sameVector(before.transform.position, after.transform.position)) continue;
      const trackId = `${characterId}:transform.position`;
      tracks = upsertPositionKeyframe(tracks, trackId, characterId, frameReport.frame, after.transform.position);
      affectedTrackIds.add(trackId);
      changedAtFrame = true;
    }
    if (changedAtFrame) bakedFrames += 1;
  }
  if (affectedTrackIds.size === 0) return { project, changed: false, bakedFrames: 0, affectedTrackIds: [], report };
  return {
    project: { ...project, animation: { ...project.animation, tracks } },
    changed: true,
    bakedFrames,
    affectedTrackIds: [...affectedTrackIds],
    report
  };
}

export function exportCollisionTimelineReport(project: MineMotionProject, startFrame = 0, endFrame = project.animation.durationFrames, stepFrames?: number): string {
  return JSON.stringify({ format: "minemotion-collision-timeline-v1", generatedAt: new Date().toISOString(), report: analyzeCollisionTimeline(project, startFrame, endFrame, stepFrames) }, null, 2);
}

function upsertPositionKeyframe(tracks: AnimationTrack[], id: string, targetId: string, frame: number, value: Vector3Tuple): AnimationTrack[] {
  const existing = tracks.find((entry) => entry.id === id);
  const keyframes = [...(existing?.keyframes ?? [])].filter((entry) => entry.frame !== frame);
  keyframes.push({ frame, value: [...value], interpolation: "ease-in-out" });
  const next: AnimationTrack = { id, targetId, property: "transform.position", keyframes: keyframes.sort((left, right) => left.frame - right.frame) };
  return existing ? tracks.map((entry) => entry.id === id ? next : entry) : [...tracks, next];
}
function sameVector(left: Vector3Tuple, right: Vector3Tuple): boolean { return left.every((value, index) => Math.abs(value - right[index]) < 1e-5); }
