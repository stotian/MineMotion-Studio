import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { applyActorAction, createFightBeat } from "./ActorChoreography";
import { applyCinematicEvent } from "./CinematicEvents";
import { buildDirectorSequence } from "./DirectorSequenceBuilder";
import { applyFilmLook, type FilmLookId } from "./FilmLook";
import type { DirectorShotRequest } from "./ShotRecipes";

export const CINEMATIC_BEAT_PRESETS = [
  "hero-entrance",
  "duel-opening",
  "ambush",
  "chase",
  "portal-arrival",
  "boss-reveal",
  "dramatic-loss",
  "victory"
] as const;
export type CinematicBeatPreset = (typeof CINEMATIC_BEAT_PRESETS)[number];

export interface CinematicBeatOptions {
  preset: CinematicBeatPreset;
  primaryActorId: string;
  secondaryActorId?: string;
  startFrame?: number;
  targetPosition?: Vector3Tuple;
  applyRecommendedLook?: boolean;
}

export interface CinematicBeatResult {
  project: MineMotionProject;
  changed: boolean;
  preset: CinematicBeatPreset;
  shotIds: string[];
  effectIds: string[];
  error: string | null;
}

export function createCinematicBeat(
  project: MineMotionProject,
  options: CinematicBeatOptions
): CinematicBeatResult {
  const primary = project.scene.characters.find((actor) => actor.id === options.primaryActorId);
  const secondary = options.secondaryActorId
    ? project.scene.characters.find((actor) => actor.id === options.secondaryActorId)
    : null;
  if (!primary) return failure(project, options.preset, "CINEMATIC_BEAT_PRIMARY_ACTOR_MISSING");
  if (requiresSecondActor(options.preset) && (!secondary || secondary.id === primary.id)) {
    return failure(project, options.preset, "CINEMATIC_BEAT_REQUIRES_TWO_DISTINCT_ACTORS");
  }
  const fps = Math.max(1, project.animation.fps);
  const start = Math.max(0, Math.round(options.startFrame ?? project.animation.currentFrame));
  const target = options.targetPosition
    ? [...options.targetPosition] as Vector3Tuple
    : [primary.transform.position[0], primary.transform.position[1], primary.transform.position[2] - 8] as Vector3Tuple;
  const requests = beatShots(options.preset, primary.id, secondary?.id, start, fps);
  const sequence = buildDirectorSequence(project, {
    name: labelForBeat(options.preset),
    requests,
    replaceExisting: false
  });
  let next = sequence.project;
  const effectIds: string[] = [];

  const action = (
    kind: Parameters<typeof applyActorAction>[1]["kind"],
    actorId: string,
    frame: number,
    duration: number,
    destination?: Vector3Tuple,
    targetActorId?: string,
    intensity = 1
  ) => {
    const result = applyActorAction(next, {
      kind,
      actorId,
      targetActorId,
      targetPosition: destination,
      startFrame: frame,
      durationFrames: duration,
      intensity
    });
    if (result.changed) next = result.project;
  };
  const event = (
    kind: Parameters<typeof applyCinematicEvent>[1]["kind"],
    frame: number,
    destination?: Vector3Tuple,
    intensity = 1
  ) => {
    const result = applyCinematicEvent(next, {
      kind,
      frame,
      primaryActorId: primary.id,
      secondaryActorId: secondary?.id,
      position: primary.transform.position,
      destination,
      intensity
    });
    if (result.changed) {
      next = result.project;
      effectIds.push(...result.effectIds);
    }
  };

  if (options.preset === "hero-entrance") {
    action("walk", primary.id, start, fps * 3, target, undefined, 0.9);
    event("heavy-landing", start + fps * 3, target, 0.9);
  } else if (options.preset === "duel-opening" && secondary) {
    action("turn", primary.id, start, fps, secondary.transform.position, secondary.id, 1);
    action("turn", secondary.id, start, fps, primary.transform.position, primary.id, 1);
    const fight = createFightBeat(next, primary.id, secondary.id, start + fps * 2, fps);
    if (fight.changed) next = fight.project;
    event("sword-clash", start + fps * 2, undefined, 1);
  } else if (options.preset === "ambush" && secondary) {
    action("walk", primary.id, start, fps * 2, target, undefined, 0.7);
    action("attack", secondary.id, start + fps * 2, fps, primary.transform.position, primary.id, 1.2);
    event("critical-hit", start + fps * 2, undefined, 0.9);
  } else if (options.preset === "chase" && secondary) {
    action("run", primary.id, start, fps * 4, target, undefined, 1.1);
    const pursuerTarget: Vector3Tuple = [target[0] + 1.8, target[1], target[2] + 2.2];
    action("run", secondary.id, start + Math.round(fps * 0.3), fps * 4, pursuerTarget, undefined, 1.15);
    event("chase-boost", start, target, 1);
  } else if (options.preset === "portal-arrival") {
    event("teleport", start + fps, target, 1.1);
    event("magic-power-up", start + fps * 2, target, 0.75);
  } else if (options.preset === "boss-reveal") {
    action("turn", primary.id, start, fps, target, undefined, 0.8);
    event("lightning", start + fps * 2, undefined, 1.25);
    event("magic-power-up", start + fps * 2, undefined, 1.25);
  } else if (options.preset === "dramatic-loss" && secondary) {
    const fight = createFightBeat(next, secondary.id, primary.id, start + fps, fps);
    if (fight.changed) next = fight.project;
    action("hit", primary.id, start + fps * 2, fps * 2, secondary.transform.position, secondary.id, 1.4);
    event("critical-hit", start + fps, undefined, 1.15);
  } else if (options.preset === "victory") {
    action("jump", primary.id, start + fps, fps, primary.transform.position, undefined, 0.8);
    event("magic-power-up", start + fps * 2, undefined, 0.65);
  }

  if (options.applyRecommendedLook !== false) {
    next = applyFilmLook(next, recommendedLook(options.preset));
  }
  return {
    project: next,
    changed: true,
    preset: options.preset,
    shotIds: sequence.createdShotIds,
    effectIds,
    error: null
  };
}

function beatShots(
  preset: CinematicBeatPreset,
  primaryId: string,
  secondaryId: string | undefined,
  start: number,
  fps: number
): DirectorShotRequest[] {
  const both = secondaryId ? [primaryId, secondaryId] : [primaryId];
  const shot = (
    kind: DirectorShotRequest["kind"],
    offsetSeconds: number,
    durationSeconds: number,
    subjects: string[],
    name: string
  ): DirectorShotRequest => ({
    kind,
    subjectIds: subjects,
    startFrame: start + Math.round(offsetSeconds * fps),
    durationFrames: Math.max(8, Math.round(durationSeconds * fps)),
    name
  });
  if (preset === "hero-entrance") return [
    shot("establishing", 0, 2, [primaryId], "World before the entrance"),
    shot("tracking", 2, 3, [primaryId], "Hero entrance tracking"),
    shot("low-angle", 5, 2, [primaryId], "Hero arrival")
  ];
  if (preset === "duel-opening") return [
    shot("two-shot", 0, 2, both, "Duel geography"),
    shot("over-shoulder-left", 2, 1.5, both, "First challenger"),
    shot("over-shoulder-right", 3.5, 1.5, both, "Second challenger"),
    shot("orbit-left", 5, 2, both, "Weapons meet")
  ];
  if (preset === "ambush") return [
    shot("tracking", 0, 2.5, [primaryId], "Unaware traveler"),
    shot("reveal", 2.5, 1.5, secondaryId ? [secondaryId] : [primaryId], "Ambusher reveal"),
    shot("close-up", 4, 1, [primaryId], "Ambush reaction"),
    shot("orbit-right", 5, 2, both, "Ambush impact")
  ];
  if (preset === "chase") return [
    shot("tracking", 0, 3, [primaryId], "Chase leader"),
    shot("two-shot", 3, 2, both, "Chase geography"),
    shot("crane-rise", 5, 2.5, both, "Chase scale")
  ];
  if (preset === "portal-arrival") return [
    shot("establishing", 0, 1.5, [primaryId], "Empty portal space"),
    shot("reveal", 1.5, 2, [primaryId], "Teleport arrival"),
    shot("dolly-in", 3.5, 2, [primaryId], "Arrival identity")
  ];
  if (preset === "boss-reveal") return [
    shot("high-angle", 0, 2, [primaryId], "Threat silhouette"),
    shot("dolly-in", 2, 2.5, [primaryId], "Boss reveal"),
    shot("low-angle", 4.5, 2, [primaryId], "Boss dominance")
  ];
  if (preset === "dramatic-loss") return [
    shot("two-shot", 0, 2, both, "Final confrontation"),
    shot("close-up", 2, 1.5, [primaryId], "Realization"),
    shot("high-angle", 3.5, 2.5, [primaryId], "Defeat"),
    shot("crane-rise", 6, 2, both, "Aftermath")
  ];
  return [
    shot("establishing", 0, 2, [primaryId], "Victory setting"),
    shot("orbit-left", 2, 3, [primaryId], "Victory orbit"),
    shot("crane-rise", 5, 2.5, [primaryId], "Victory finale")
  ];
}

function recommendedLook(preset: CinematicBeatPreset): FilmLookId {
  if (preset === "ambush" || preset === "dramatic-loss") return "horror-night";
  if (preset === "duel-opening" || preset === "chase") return "storm-battle";
  if (preset === "portal-arrival" || preset === "boss-reveal") return "end-mystery";
  return "golden-epic";
}

function requiresSecondActor(preset: CinematicBeatPreset): boolean {
  return ["duel-opening", "ambush", "chase", "dramatic-loss"].includes(preset);
}

export function labelForBeat(preset: CinematicBeatPreset): string {
  return preset.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function failure(project: MineMotionProject, preset: CinematicBeatPreset, error: string): CinematicBeatResult {
  return { project, changed: false, preset, shotIds: [], effectIds: [], error };
}
