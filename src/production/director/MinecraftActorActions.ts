import { createVectorKeyframe } from "../../animation/Keyframe";
import type { AnimatableProperty, AnimationTrack, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { lookAtRotation } from "./CameraMath";

export const MINECRAFT_ACTOR_ACTIONS = [
  "mine",
  "place-block",
  "bow-shot",
  "eat",
  "drink-potion",
  "wave",
  "point",
  "celebrate",
  "sneak",
  "swim",
  "elytra-flight"
] as const;
export type MinecraftActorAction = (typeof MINECRAFT_ACTOR_ACTIONS)[number];

export interface MinecraftActorActionOptions {
  kind: MinecraftActorAction;
  actorId: string;
  startFrame?: number;
  durationFrames?: number;
  targetPosition?: Vector3Tuple;
  intensity?: number;
}

export interface MinecraftActorActionResult {
  project: MineMotionProject;
  changed: boolean;
  kind: MinecraftActorAction;
  actorId: string;
  trackIds: string[];
  error: string | null;
}

export function applyMinecraftActorAction(
  project: MineMotionProject,
  options: MinecraftActorActionOptions
): MinecraftActorActionResult {
  const actor = project.scene.characters.find((candidate) => candidate.id === options.actorId);
  if (!actor) return failure(project, options.kind, options.actorId, "MINECRAFT_ACTION_ACTOR_MISSING");
  if (actor.locked) return failure(project, options.kind, options.actorId, "MINECRAFT_ACTION_ACTOR_LOCKED");
  const start = Math.max(0, Math.round(options.startFrame ?? project.animation.currentFrame));
  const duration = Math.max(8, Math.min(480, Math.round(options.durationFrames ?? project.animation.fps * 1.5)));
  const end = start + duration;
  const intensity = Math.max(0.25, Math.min(2, options.intensity ?? 1));
  const target = options.targetPosition
    ? [...options.targetPosition] as Vector3Tuple
    : [actor.transform.position[0], actor.transform.position[1], actor.transform.position[2] - 5] as Vector3Tuple;
  let tracks = project.animation.tracks;
  const trackIds: string[] = [];
  const bone = (boneId: string, entries: Array<[number, Vector3Tuple]>) => {
    const property = `bone.rotation.${boneId}` as AnimatableProperty;
    tracks = upsert(tracks, actor.id, property, entries);
    trackIds.push(`${actor.id}:${property}`);
  };
  const transform = (property: "transform.position" | "transform.rotation", entries: Array<[number, Vector3Tuple]>) => {
    tracks = upsert(tracks, actor.id, property, entries);
    trackIds.push(`${actor.id}:${property}`);
  };
  const quarter = Math.round(duration * 0.25);
  const half = Math.round(duration * 0.5);
  const threeQuarter = Math.round(duration * 0.75);

  if (options.kind === "mine") {
    bone("rightArm", cycles(start, end, 4, [-42 * intensity, 0, 10], [58 * intensity, 0, -12]));
    bone("leftArm", [[start, [-12, 0, -8]], [end, [-12, 0, -8]]]);
    bone("body", cycles(start, end, 4, [0, -8 * intensity, 0], [0, 8 * intensity, 0]));
  } else if (options.kind === "place-block") {
    bone("rightArm", [[start, [0, 0, 0]], [start + half, [-78 * intensity, -12, 4]], [end, [0, 0, 0]]]);
    bone("head", [[start, [0, 0, 0]], [start + half, [18, 0, 0]], [end, [0, 0, 0]]]);
  } else if (options.kind === "bow-shot") {
    bone("leftArm", [[start, [0, 0, 0]], [start + quarter, [-88, 0, -8]], [start + threeQuarter, [-88, 0, -8]], [end, [0, 0, 0]]]);
    bone("rightArm", [[start, [0, 0, 0]], [start + quarter, [-78, 28, 35]], [start + threeQuarter, [-78, 28, 35]], [end, [18 * intensity, -8, 0]]]);
    bone("body", [[start, [0, 0, 0]], [start + half, [0, -12 * intensity, 0]], [end, [0, 0, 0]]]);
  } else if (options.kind === "eat" || options.kind === "drink-potion") {
    const lift = options.kind === "eat" ? -105 : -125;
    bone("rightArm", cycles(start, end, 4, [lift, 8, 4], [lift + 14 * intensity, -4, -4]));
    bone("head", cycles(start, end, 4, [3, 0, 0], [-7 * intensity, 0, 0]));
  } else if (options.kind === "wave") {
    bone("rightArm", [[start, [0, 0, 0]], [start + quarter, [-145, 0, 0]], [start + half, [-145, 0, 24 * intensity]], [start + threeQuarter, [-145, 0, -24 * intensity]], [end, [0, 0, 0]]]);
  } else if (options.kind === "point") {
    bone("rightArm", [[start, [0, 0, 0]], [start + quarter, [-88, 0, 0]], [start + threeQuarter, [-88, 0, 0]], [end, [0, 0, 0]]]);
    const facing = lookAtRotation(actor.transform.position, target);
    transform("transform.rotation", [[start, actor.transform.rotation], [start + quarter, [0, facing[1], 0]], [end, [0, facing[1], 0]]]);
  } else if (options.kind === "celebrate") {
    bone("rightArm", [[start, [0, 0, 0]], [start + quarter, [-165, 0, 10]], [start + threeQuarter, [-165, 0, -10]], [end, [0, 0, 0]]]);
    bone("leftArm", [[start, [0, 0, 0]], [start + quarter, [-165, 0, -10]], [start + threeQuarter, [-165, 0, 10]], [end, [0, 0, 0]]]);
    transform("transform.position", [[start, actor.transform.position], [start + half, [actor.transform.position[0], actor.transform.position[1] + 1.1 * intensity, actor.transform.position[2]]], [end, actor.transform.position]]);
  } else if (options.kind === "sneak") {
    bone("body", [[start, [18 * intensity, 0, 0]], [end, [18 * intensity, 0, 0]]]);
    bone("rightLeg", cycles(start, end, 3, [18, 0, 0], [-18, 0, 0]));
    bone("leftLeg", cycles(start, end, 3, [-18, 0, 0], [18, 0, 0]));
    transform("transform.position", [[start, actor.transform.position], [end, target]]);
  } else if (options.kind === "swim") {
    bone("rightArm", cycles(start, end, 3, [-160, 0, 12], [20, 0, -12]));
    bone("leftArm", cycles(start, end, 3, [20, 0, 12], [-160, 0, -12]));
    bone("rightLeg", cycles(start, end, 4, [18, 0, 0], [-18, 0, 0]));
    bone("leftLeg", cycles(start, end, 4, [-18, 0, 0], [18, 0, 0]));
    const facing = lookAtRotation(actor.transform.position, target);
    transform("transform.rotation", [[start, actor.transform.rotation], [start + quarter, [72, facing[1], 0]], [end, [72, facing[1], 0]]]);
    transform("transform.position", [[start, actor.transform.position], [end, target]]);
  } else {
    bone("rightArm", [[start, [0, 0, 0]], [start + quarter, [28, 0, 18]], [end, [28, 0, 18]]]);
    bone("leftArm", [[start, [0, 0, 0]], [start + quarter, [28, 0, -18]], [end, [28, 0, -18]]]);
    bone("rightLeg", [[start, [0, 0, 0]], [start + quarter, [8, 0, 0]], [end, [8, 0, 0]]]);
    bone("leftLeg", [[start, [0, 0, 0]], [start + quarter, [8, 0, 0]], [end, [8, 0, 0]]]);
    const facing = lookAtRotation(actor.transform.position, target);
    transform("transform.rotation", [[start, actor.transform.rotation], [start + quarter, [82, facing[1], 0]], [end, [82, facing[1], 0]]]);
    transform("transform.position", [[start, actor.transform.position], [end, target]]);
  }

  const next = syncCinematicTimeline({
    ...project,
    projectSettings: { ...project.projectSettings, durationFrames: Math.max(project.projectSettings.durationFrames, end) },
    animation: { ...project.animation, durationFrames: Math.max(project.animation.durationFrames, end), tracks },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  });
  return { project: next, changed: true, kind: options.kind, actorId: actor.id, trackIds: [...new Set(trackIds)], error: null };
}

function cycles(start: number, end: number, count: number, first: Vector3Tuple, second: Vector3Tuple): Array<[number, Vector3Tuple]> {
  const entries: Array<[number, Vector3Tuple]> = [];
  const steps = Math.max(2, count * 2);
  for (let index = 0; index <= steps; index += 1) {
    entries.push([Math.round(start + (end - start) * index / steps), index % 2 === 0 ? first : second]);
  }
  return entries;
}

function upsert(
  tracks: AnimationTrack[],
  targetId: string,
  property: AnimatableProperty,
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

function failure(project: MineMotionProject, kind: MinecraftActorAction, actorId: string, error: string): MinecraftActorActionResult {
  return { project, changed: false, kind, actorId, trackIds: [], error };
}
