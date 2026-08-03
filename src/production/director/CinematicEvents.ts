import { createVectorKeyframe } from "../../animation/Keyframe";
import { spawnEffectAtFrame } from "../../effects/EffectSpawner";
import { MAX_EFFECT_INSTANCES, type EffectInstance, type EffectParameters, type EffectType } from "../../effects/EffectTypes";
import type { AnimationTrack, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { applyActorAction, createFightBeat } from "./ActorChoreography";

export const CINEMATIC_EVENT_KINDS = [
  "explosion",
  "sword-clash",
  "critical-hit",
  "lightning",
  "teleport",
  "magic-power-up",
  "heavy-landing",
  "chase-boost"
] as const;
export type CinematicEventKind = (typeof CINEMATIC_EVENT_KINDS)[number];

export interface CinematicEventRequest {
  kind: CinematicEventKind;
  frame: number;
  primaryActorId?: string;
  secondaryActorId?: string;
  position?: Vector3Tuple;
  destination?: Vector3Tuple;
  intensity?: number;
}

export interface CinematicEventResult {
  project: MineMotionProject;
  changed: boolean;
  eventKind: CinematicEventKind;
  effectIds: string[];
  error: string | null;
}

export function applyCinematicEvent(
  project: MineMotionProject,
  request: CinematicEventRequest
): CinematicEventResult {
  const frame = Math.max(0, Math.round(request.frame));
  const intensity = Math.min(2, Math.max(0.25, request.intensity ?? 1));
  const primary = request.primaryActorId
    ? project.scene.characters.find((actor) => actor.id === request.primaryActorId)
    : null;
  const secondary = request.secondaryActorId
    ? project.scene.characters.find((actor) => actor.id === request.secondaryActorId)
    : null;
  const position = request.position
    ? [...request.position] as Vector3Tuple
    : primary
      ? [...primary.transform.position] as Vector3Tuple
      : [0, 1, 0] as Vector3Tuple;
  let next = project;
  const effects: EffectInstance[] = [];
  const add = (
    type: EffectType,
    offset = 0,
    targetId = primary?.id ?? "",
    parameters: Partial<EffectParameters> = {},
    eventPosition: Vector3Tuple = position
  ) => {
    const effect = spawnEffectAtFrame(type, frame + offset, targetId);
    effects.push({
      ...effect,
      position: [...eventPosition] as Vector3Tuple,
      parameters: {
        ...effect.parameters,
        ...parameters,
        intensity: (parameters.intensity ?? effect.parameters.intensity ?? 1) * intensity
      }
    });
  };

  if (request.kind === "explosion") {
    add("nativeExplosion", 0, primary?.id ?? "", { radius: 4 * intensity, count: Math.round(64 * intensity) });
    add("explosionFlash", 0, "", { alpha: 0.82 });
    add("cameraShake", 0, "", { strength: 1.15 * intensity, decay: 0.9 });
    add("shockwave", 1, primary?.id ?? "", { radius: 5 * intensity });
    if (primary) {
      next = applyActorAction(next, {
        kind: "hit",
        actorId: primary.id,
        targetPosition: position,
        startFrame: frame + 2,
        durationFrames: Math.max(12, Math.round(next.animation.fps * 0.7)),
        intensity
      }).project;
    }
  } else if (request.kind === "sword-clash") {
    if (!primary || !secondary) return failure(project, request.kind, "SWORD_CLASH_REQUIRES_TWO_ACTORS");
    const duration = Math.max(16, Math.round(project.animation.fps * 0.8));
    const first = applyActorAction(next, {
      kind: "attack",
      actorId: primary.id,
      targetActorId: secondary.id,
      startFrame: frame,
      durationFrames: duration,
      intensity
    });
    next = first.project;
    next = applyActorAction(next, {
      kind: "attack",
      actorId: secondary.id,
      targetActorId: primary.id,
      startFrame: frame,
      durationFrames: duration,
      intensity
    }).project;
    const clashPosition = midpoint(primary.transform.position, secondary.transform.position);
    add("combatSparks", Math.round(duration * 0.55), "", { count: Math.round(30 * intensity) }, clashPosition);
    add("parryBurst", Math.round(duration * 0.55), "", { radius: 1.4 * intensity }, clashPosition);
    add("hitStop", Math.round(duration * 0.55), "", { alpha: 0.3 });
    add("cameraShake", Math.round(duration * 0.55), "", { strength: 0.55 * intensity });
  } else if (request.kind === "critical-hit") {
    if (!primary || !secondary) return failure(project, request.kind, "CRITICAL_HIT_REQUIRES_TWO_ACTORS");
    const duration = Math.max(18, Math.round(project.animation.fps));
    next = createFightBeat(next, primary.id, secondary.id, frame, duration).project;
    const impact = midpoint(primary.transform.position, secondary.transform.position);
    add("criticalHit", Math.round(duration * 0.5), secondary.id, { count: Math.round(58 * intensity) }, impact);
    add("impactFrame", Math.round(duration * 0.5), "", { contrast: 1.9, alpha: 0.9 });
    add("hitStop", Math.round(duration * 0.5), "", { alpha: 0.35 });
    add("cameraShake", Math.round(duration * 0.5), "", { strength: 1.05 * intensity });
  } else if (request.kind === "lightning") {
    add("lightningStrike", 0, primary?.id ?? "", { radius: 3 * intensity });
    add("flash", 0, "", { alpha: 0.88, color: "#d9f5ff" });
    add("cameraShake", 1, "", { strength: 0.72 * intensity });
    add("electricSparks", 2, primary?.id ?? "", { count: Math.round(36 * intensity) });
  } else if (request.kind === "teleport") {
    if (!primary || !request.destination) return failure(project, request.kind, "TELEPORT_REQUIRES_ACTOR_AND_DESTINATION");
    add("magicTeleport", 0, primary.id, { radius: 1.8 * intensity }, primary.transform.position);
    add("screenGlitch", 0, "", { strength: 0.5 * intensity });
    add("magicTeleport", 3, primary.id, { radius: 1.8 * intensity }, request.destination);
    next = teleportActor(next, primary.id, frame, request.destination);
  } else if (request.kind === "magic-power-up") {
    if (!primary) return failure(project, request.kind, "MAGIC_POWER_UP_REQUIRES_ACTOR");
    add("magicPowerUp", 0, primary.id, { radius: 2.2 * intensity, count: Math.round(48 * intensity) });
    add("magicAura", 0, primary.id, { radius: 1.8 * intensity });
    add("screenBloom", 4, "", { alpha: 0.45 * intensity });
    add("cameraShake", 5, "", { strength: 0.28 * intensity, frequency: 12 });
    next = applyActorAction(next, {
      kind: "idle",
      actorId: primary.id,
      startFrame: frame,
      durationFrames: Math.max(24, Math.round(project.animation.fps * 2)),
      intensity: 1.3 * intensity
    }).project;
  } else if (request.kind === "heavy-landing") {
    if (!primary) return failure(project, request.kind, "HEAVY_LANDING_REQUIRES_ACTOR");
    add("landingDust", 0, primary.id, { radius: 2.5 * intensity, count: Math.round(40 * intensity) });
    add("groundSlam", 1, primary.id, { radius: 3.8 * intensity });
    add("cameraShake", 0, "", { strength: 0.82 * intensity });
    next = applyActorAction(next, {
      kind: "jump",
      actorId: primary.id,
      targetPosition: primary.transform.position,
      startFrame: Math.max(0, frame - Math.round(project.animation.fps * 0.7)),
      durationFrames: Math.max(12, Math.round(project.animation.fps * 0.7)),
      intensity
    }).project;
  } else if (request.kind === "chase-boost") {
    if (!primary) return failure(project, request.kind, "CHASE_BOOST_REQUIRES_ACTOR");
    const destination: Vector3Tuple = request.destination
      ? [...request.destination] as Vector3Tuple
      : [
          primary.transform.position[0],
          primary.transform.position[1],
          primary.transform.position[2] - 10
        ];
    add("speedLines", 0, primary.id, { alpha: 0.55, speed: 1.6 * intensity });
    add("movementRunning", 0, primary.id, { intensity: 1.2 * intensity });
    add("movementDash", 2, primary.id, { intensity: 1.4 * intensity });
    add("cameraShake", 0, "", { strength: 0.18 * intensity, frequency: 18 });
    next = applyActorAction(next, {
      kind: "run",
      actorId: primary.id,
      targetPosition: destination,
      startFrame: frame,
      durationFrames: Math.max(18, Math.round(project.animation.fps * 1.5)),
      intensity: 1.15 * intensity
    }).project;
  }

  if (effects.length === 0) return failure(project, request.kind, "CINEMATIC_EVENT_CREATED_NO_EFFECTS");
  if (next.effects.instances.length + effects.length > MAX_EFFECT_INSTANCES) {
    return failure(project, request.kind, "CINEMATIC_EVENT_EFFECT_LIMIT_REACHED");
  }
  const effectIds = effects.map((effect) => effect.id);
  next = syncCinematicTimeline({
    ...next,
    effects: {
      ...next.effects,
      instances: [...next.effects.instances, ...effects]
    },
    metadata: {
      ...next.metadata,
      updatedAt: new Date().toISOString()
    }
  });
  return { project: next, changed: true, eventKind: request.kind, effectIds, error: null };
}

function teleportActor(
  project: MineMotionProject,
  actorId: string,
  frame: number,
  destination: Vector3Tuple
): MineMotionProject {
  const actor = project.scene.characters.find((candidate) => candidate.id === actorId);
  if (!actor) return project;
  const id = `${actor.id}:transform.position`;
  const existing = project.animation.tracks.find((track) => track.id === id);
  const keyframes = [...(existing?.keyframes ?? [])].filter((keyframe) => keyframe.frame < frame || keyframe.frame > frame + 2);
  keyframes.push(
    { ...createVectorKeyframe(frame, actor.transform.position), interpolation: "constant" },
    { ...createVectorKeyframe(frame + 1, actor.transform.position), interpolation: "constant" },
    { ...createVectorKeyframe(frame + 2, destination), interpolation: "constant" }
  );
  const track: AnimationTrack = {
    id,
    targetId: actor.id,
    property: "transform.position",
    keyframes: keyframes.sort((a, b) => a.frame - b.frame)
  };
  return {
    ...project,
    projectSettings: {
      ...project.projectSettings,
      durationFrames: Math.max(project.projectSettings.durationFrames, frame + 2)
    },
    animation: {
      ...project.animation,
      durationFrames: Math.max(project.animation.durationFrames, frame + 2),
      tracks: existing
        ? project.animation.tracks.map((candidate) => candidate.id === id ? track : candidate)
        : [...project.animation.tracks, track]
    }
  };
}

function midpoint(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 1, (a[2] + b[2]) / 2];
}

function failure(
  project: MineMotionProject,
  eventKind: CinematicEventKind,
  error: string
): CinematicEventResult {
  return { project, changed: false, eventKind, effectIds: [], error };
}
