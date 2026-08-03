import { createVectorKeyframe } from "../../animation/Keyframe";
import type { AnimationTrack, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { lookAtRotation } from "./CameraMath";

export const ACTOR_FORMATIONS = [
  "line",
  "semicircle",
  "circle",
  "battle-lines",
  "marching-column",
  "audience"
] as const;
export type ActorFormation = (typeof ACTOR_FORMATIONS)[number];

export interface ActorBlockingOptions {
  formation: ActorFormation;
  actorIds: string[];
  center?: Vector3Tuple;
  spacing?: number;
  faceTarget?: Vector3Tuple;
  frame?: number;
  animateFrames?: number;
}

export interface ActorBlockingResult {
  project: MineMotionProject;
  changed: boolean;
  formation: ActorFormation;
  actorIds: string[];
  error: string | null;
}

export function stageActorFormation(
  project: MineMotionProject,
  options: ActorBlockingOptions
): ActorBlockingResult {
  const ids = [...new Set(options.actorIds)].filter((id) => project.scene.characters.some((actor) => actor.id === id));
  if (ids.length === 0) return failure(project, options.formation, "ACTOR_FORMATION_HAS_NO_VALID_ACTORS");
  const center = options.center ? [...options.center] as Vector3Tuple : [0, 1.05, 0] as Vector3Tuple;
  const spacing = Math.max(0.75, Math.min(12, options.spacing ?? 2.2));
  const target = options.faceTarget ? [...options.faceTarget] as Vector3Tuple : [center[0], center[1] + 0.4, center[2] - 8] as Vector3Tuple;
  const frame = Math.max(0, Math.round(options.frame ?? project.animation.currentFrame));
  const animateFrames = Math.max(0, Math.round(options.animateFrames ?? 0));
  const positions = formationPositions(options.formation, ids.length, center, spacing);
  let tracks = project.animation.tracks;
  const characters = project.scene.characters.map((actor) => {
    const index = ids.indexOf(actor.id);
    if (index < 0) return actor;
    const position = positions[index];
    const rotation = lookAtRotation(position, target);
    if (animateFrames > 0) {
      tracks = upsertTransform(tracks, actor.id, "transform.position", [
        [frame, actor.transform.position],
        [frame + animateFrames, position]
      ]);
      tracks = upsertTransform(tracks, actor.id, "transform.rotation", [
        [frame, actor.transform.rotation],
        [frame + animateFrames, [0, rotation[1], 0]]
      ]);
    } else {
      tracks = upsertTransform(tracks, actor.id, "transform.position", [[frame, position]]);
      tracks = upsertTransform(tracks, actor.id, "transform.rotation", [[frame, [0, rotation[1], 0]]]);
    }
    return {
      ...actor,
      transform: { ...actor.transform, position, rotation: [0, rotation[1], 0] as Vector3Tuple },
      metadata: { ...actor.metadata, directorFormation: options.formation, directorFormationIndex: index }
    };
  });
  const end = frame + animateFrames;
  const next = syncCinematicTimeline({
    ...project,
    scene: { ...project.scene, characters },
    projectSettings: { ...project.projectSettings, durationFrames: Math.max(project.projectSettings.durationFrames, end) },
    animation: { ...project.animation, durationFrames: Math.max(project.animation.durationFrames, end), tracks },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  });
  return { project: next, changed: true, formation: options.formation, actorIds: ids, error: null };
}

export function formationPositions(
  formation: ActorFormation,
  count: number,
  center: Vector3Tuple,
  spacing: number
): Vector3Tuple[] {
  if (count <= 0) return [];
  if (formation === "line") {
    return Array.from({ length: count }, (_, index) => [center[0] + (index - (count - 1) / 2) * spacing, center[1], center[2]]);
  }
  if (formation === "semicircle") {
    const radius = Math.max(spacing, spacing * count / Math.PI);
    return Array.from({ length: count }, (_, index) => {
      const t = count === 1 ? 0.5 : index / (count - 1);
      const angle = Math.PI * (0.1 + 0.8 * t);
      return [center[0] + Math.cos(angle) * radius, center[1], center[2] + Math.sin(angle) * radius - radius * 0.55];
    });
  }
  if (formation === "circle") {
    const radius = Math.max(spacing, spacing * count / (Math.PI * 2));
    return Array.from({ length: count }, (_, index) => {
      const angle = index / count * Math.PI * 2;
      return [center[0] + Math.cos(angle) * radius, center[1], center[2] + Math.sin(angle) * radius];
    });
  }
  if (formation === "battle-lines") {
    const leftCount = Math.ceil(count / 2);
    return Array.from({ length: count }, (_, index) => {
      const left = index < leftCount;
      const rowIndex = left ? index : index - leftCount;
      const sideCount = left ? leftCount : count - leftCount;
      return [center[0] + (rowIndex - (sideCount - 1) / 2) * spacing, center[1], center[2] + (left ? spacing * 1.5 : -spacing * 1.5)];
    });
  }
  if (formation === "marching-column") {
    return Array.from({ length: count }, (_, index) => {
      const lane = index % 2;
      const row = Math.floor(index / 2);
      return [center[0] + (lane - 0.5) * spacing, center[1], center[2] + row * spacing];
    });
  }
  const columns = Math.max(2, Math.ceil(Math.sqrt(count * 1.5)));
  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return [center[0] + (column - (columns - 1) / 2) * spacing, center[1] + row * 0.22, center[2] + row * spacing];
  });
}

function upsertTransform(
  tracks: AnimationTrack[],
  targetId: string,
  property: "transform.position" | "transform.rotation",
  entries: Array<[number, Vector3Tuple]>
): AnimationTrack[] {
  const id = `${targetId}:${property}`;
  const existing = tracks.find((track) => track.id === id);
  const byFrame = new Map<number, AnimationTrack["keyframes"][number]>();
  for (const keyframe of existing?.keyframes ?? []) byFrame.set(keyframe.frame, keyframe);
  for (const [frame, value] of entries) byFrame.set(frame, { ...createVectorKeyframe(frame, value), interpolation: "ease-in-out" });
  const track: AnimationTrack = { id, targetId, property, keyframes: [...byFrame.values()].sort((a, b) => a.frame - b.frame) };
  return existing ? tracks.map((candidate) => candidate.id === id ? track : candidate) : [...tracks, track];
}

function failure(project: MineMotionProject, formation: ActorFormation, error: string): ActorBlockingResult {
  return { project, changed: false, formation, actorIds: [], error };
}
