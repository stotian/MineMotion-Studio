import { createVectorKeyframe } from "../../animation/Keyframe";
import type {
  AnimatableProperty,
  AnimationTrack,
  MineMotionProject,
  Vector3Tuple
} from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import {
  createDefaultProceduralAnimationSettings,
  type ProceduralAnimationKind
} from "../../rigs/procedural/ProceduralAnimation";
import { bakeProceduralAnimation } from "../../rigs/procedural/ProceduralAnimationController";
import {
  addVector,
  horizontalDirection,
  lookAtRotation,
  scaleVector,
  subtractVector,
  vectorLength
} from "./CameraMath";

export const ACTOR_ACTION_KINDS = [
  "idle",
  "walk",
  "run",
  "jump",
  "turn",
  "attack",
  "hit",
  "crouch"
] as const;
export type ActorActionKind = (typeof ACTOR_ACTION_KINDS)[number];

export interface ActorActionRequest {
  kind: ActorActionKind;
  actorId: string;
  startFrame: number;
  durationFrames: number;
  targetPosition?: Vector3Tuple;
  targetActorId?: string;
  intensity?: number;
}

export interface ActorActionResult {
  project: MineMotionProject;
  changed: boolean;
  actorId: string;
  kind: ActorActionKind;
  addedTrackIds: string[];
  error: string | null;
}

export function applyActorAction(
  project: MineMotionProject,
  request: ActorActionRequest
): ActorActionResult {
  const actor = project.scene.characters.find((candidate) => candidate.id === request.actorId);
  if (!actor) return failure(project, request, "ACTOR_ACTION_TARGET_MISSING: Select a character.");
  if (actor.locked) return failure(project, request, "ACTOR_ACTION_TARGET_LOCKED: Unlock the character.");
  const startFrame = Math.max(0, Math.round(request.startFrame));
  const durationFrames = Math.max(4, Math.round(request.durationFrames));
  const endFrame = startFrame + durationFrames;
  const intensity = Math.min(2, Math.max(0.2, request.intensity ?? 1));
  const targetActor = request.targetActorId
    ? project.scene.characters.find((candidate) => candidate.id === request.targetActorId)
    : null;
  const target = request.targetPosition
    ? [...request.targetPosition] as Vector3Tuple
    : targetActor
      ? [...targetActor.transform.position] as Vector3Tuple
      : defaultTarget(actor.transform.position, actor.transform.rotation[1]);
  const direction = horizontalDirection(actor.transform.position, target);
  const distance = vectorLength(subtractVector(target, actor.transform.position));
  const proceduralKind = proceduralKindForAction(request.kind);
  const settings = createDefaultProceduralAnimationSettings(proceduralKind);
  settings.durationFrames = durationFrames;
  settings.intensity = intensity;
  settings.cycles = actionCycles(request.kind, durationFrames, project.animation.fps);
  settings.direction = 1;

  const originalFrame = project.animation.currentFrame;
  const procedural = bakeProceduralAnimation(
    {
      ...project,
      animation: { ...project.animation, currentFrame: startFrame }
    },
    actor.id,
    settings
  );
  if (!procedural.changed) return failure(project, request, procedural.error ?? "ACTOR_ACTION_GENERATION_FAILED");

  let tracks = procedural.project.animation.tracks;
  const addedTrackIds: string[] = [];
  const rotation = lookAtRotation(actor.transform.position, target);
  const facing: Vector3Tuple = [0, rotation[1], 0];
  if (request.kind !== "idle") {
    tracks = upsertTrackKeyframes(tracks, actor.id, "transform.rotation", [
      [startFrame, actor.transform.rotation],
      [Math.min(endFrame, startFrame + Math.max(2, Math.round(durationFrames * 0.2))), facing]
    ]);
    addedTrackIds.push(`${actor.id}:transform.rotation`);
  }

  if (request.kind === "walk" || request.kind === "run" || request.kind === "crouch") {
    const destination = distance < 0.1
      ? addVector(actor.transform.position, scaleVector(direction, request.kind === "run" ? 8 : 4))
      : target;
    tracks = upsertTrackKeyframes(tracks, actor.id, "transform.position", [
      [startFrame, actor.transform.position],
      [endFrame, destination]
    ]);
    addedTrackIds.push(`${actor.id}:transform.position`);
  } else if (request.kind === "jump") {
    const destination = distance < 0.1
      ? addVector(actor.transform.position, scaleVector(direction, 3.5))
      : target;
    const apex = addVector([
      (actor.transform.position[0] + destination[0]) / 2,
      (actor.transform.position[1] + destination[1]) / 2,
      (actor.transform.position[2] + destination[2]) / 2
    ], [0, 2.2 * intensity, 0]);
    tracks = upsertTrackKeyframes(tracks, actor.id, "transform.position", [
      [startFrame, actor.transform.position],
      [startFrame + Math.round(durationFrames * 0.5), apex],
      [endFrame, destination]
    ]);
    addedTrackIds.push(`${actor.id}:transform.position`);
  } else if (request.kind === "attack") {
    const lungeDistance = Math.min(1.4, Math.max(0.5, distance * 0.25)) * intensity;
    const lunge = addVector(actor.transform.position, scaleVector(direction, lungeDistance));
    tracks = upsertTrackKeyframes(tracks, actor.id, "transform.position", [
      [startFrame, actor.transform.position],
      [startFrame + Math.round(durationFrames * 0.55), lunge],
      [endFrame, actor.transform.position]
    ]);
    addedTrackIds.push(`${actor.id}:transform.position`);
  } else if (request.kind === "hit") {
    const away = scaleVector(direction, -1);
    const knockback = addVector(actor.transform.position, scaleVector(away, 1.1 * intensity));
    const settle = addVector(actor.transform.position, scaleVector(away, 0.72 * intensity));
    tracks = upsertTrackKeyframes(tracks, actor.id, "transform.position", [
      [startFrame, actor.transform.position],
      [startFrame + Math.round(durationFrames * 0.42), knockback],
      [endFrame, settle]
    ]);
    addedTrackIds.push(`${actor.id}:transform.position`);
  }

  const next = syncCinematicTimeline({
    ...procedural.project,
    projectSettings: {
      ...procedural.project.projectSettings,
      durationFrames: Math.max(procedural.project.projectSettings.durationFrames, endFrame)
    },
    animation: {
      ...procedural.project.animation,
      currentFrame: originalFrame,
      durationFrames: Math.max(procedural.project.animation.durationFrames, endFrame),
      tracks
    },
    metadata: {
      ...procedural.project.metadata,
      updatedAt: new Date().toISOString()
    }
  });
  return {
    project: next,
    changed: true,
    actorId: actor.id,
    kind: request.kind,
    addedTrackIds: [...new Set(addedTrackIds)],
    error: null
  };
}

export function createFightBeat(
  project: MineMotionProject,
  attackerId: string,
  defenderId: string,
  startFrame = project.animation.currentFrame,
  durationFrames = Math.max(16, project.animation.fps)
): ActorActionResult {
  const defender = project.scene.characters.find((character) => character.id === defenderId);
  if (!defender) return failure(project, { kind: "attack", actorId: attackerId }, "FIGHT_BEAT_DEFENDER_MISSING");
  const attack = applyActorAction(project, {
    kind: "attack",
    actorId: attackerId,
    targetActorId: defenderId,
    startFrame,
    durationFrames,
    intensity: 1.15
  });
  if (!attack.changed) return attack;
  const hit = applyActorAction(attack.project, {
    kind: "hit",
    actorId: defenderId,
    targetActorId: attackerId,
    startFrame: startFrame + Math.round(durationFrames * 0.48),
    durationFrames: Math.max(8, Math.round(durationFrames * 0.7)),
    intensity: 1.1
  });
  return {
    ...hit,
    kind: "attack",
    actorId: attackerId,
    addedTrackIds: [...new Set([...attack.addedTrackIds, ...hit.addedTrackIds])]
  };
}

export function createWalkAndTalk(
  project: MineMotionProject,
  firstActorId: string,
  secondActorId: string,
  destination: Vector3Tuple,
  startFrame = project.animation.currentFrame,
  durationFrames = Math.max(48, project.animation.fps * 4)
): ActorActionResult {
  const first = project.scene.characters.find((actor) => actor.id === firstActorId);
  const second = project.scene.characters.find((actor) => actor.id === secondActorId);
  if (!first || !second || first.id === second.id) {
    return failure(project, { kind: "walk", actorId: firstActorId }, "WALK_AND_TALK_REQUIRES_TWO_ACTORS");
  }
  const separation = subtractVector(second.transform.position, first.transform.position);
  const firstMove = applyActorAction(project, {
    kind: "walk",
    actorId: first.id,
    targetPosition: destination,
    startFrame,
    durationFrames,
    intensity: 0.9
  });
  if (!firstMove.changed) return firstMove;
  const secondDestination = addVector(destination, separation);
  const secondMove = applyActorAction(firstMove.project, {
    kind: "walk",
    actorId: second.id,
    targetPosition: secondDestination,
    startFrame,
    durationFrames,
    intensity: 0.9
  });
  return {
    ...secondMove,
    actorId: first.id,
    kind: "walk",
    addedTrackIds: [...new Set([...firstMove.addedTrackIds, ...secondMove.addedTrackIds])]
  };
}

function upsertTrackKeyframes(
  tracks: AnimationTrack[],
  targetId: string,
  property: AnimatableProperty,
  entries: Array<[number, Vector3Tuple]>
): AnimationTrack[] {
  const id = `${targetId}:${property}`;
  const existing = tracks.find((track) => track.id === id);
  const byFrame = new Map<number, AnimationTrack["keyframes"][number]>();
  for (const keyframe of existing?.keyframes ?? []) byFrame.set(keyframe.frame, keyframe);
  for (const [frame, value] of entries) {
    byFrame.set(frame, {
      ...createVectorKeyframe(frame, value),
      interpolation: "ease-in-out"
    });
  }
  const nextTrack: AnimationTrack = {
    id,
    targetId,
    property,
    keyframes: [...byFrame.values()].sort((a, b) => a.frame - b.frame)
  };
  return existing
    ? tracks.map((track) => track.id === id ? nextTrack : track)
    : [...tracks, nextTrack];
}

function proceduralKindForAction(kind: ActorActionKind): ProceduralAnimationKind {
  if (kind === "attack") return "swordSwing";
  if (kind === "hit") return "hitReaction";
  return kind;
}

function actionCycles(kind: ActorActionKind, durationFrames: number, fps: number): number {
  if (kind !== "walk" && kind !== "run" && kind !== "crouch" && kind !== "idle") return 1;
  return Math.max(1, Math.min(8, Math.round(durationFrames / Math.max(8, fps * 0.55))));
}

function defaultTarget(position: Vector3Tuple, yawDegrees: number): Vector3Tuple {
  const radians = -yawDegrees * Math.PI / 180;
  return [position[0] + Math.sin(radians) * 4, position[1], position[2] - Math.cos(radians) * 4];
}

function failure(
  project: MineMotionProject,
  request: Pick<ActorActionRequest, "actorId" | "kind">,
  error: string
): ActorActionResult {
  return {
    project,
    changed: false,
    actorId: request.actorId,
    kind: request.kind,
    addedTrackIds: [],
    error
  };
}
