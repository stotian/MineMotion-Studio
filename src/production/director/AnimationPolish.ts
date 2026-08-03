import { createVectorKeyframe } from "../../animation/Keyframe";
import type { AnimationTrack, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";

export const ANIMATION_POLISH_ACTIONS = [
  "breathing",
  "weight-shift",
  "look-left",
  "look-right",
  "anticipation",
  "follow-through",
  "recoil",
  "settle"
] as const;
export type AnimationPolishAction = (typeof ANIMATION_POLISH_ACTIONS)[number];

export interface AnimationPolishResult {
  project: MineMotionProject;
  changed: boolean;
  actorId: string;
  action: AnimationPolishAction;
  trackIds: string[];
  error: string | null;
}

export function applyAnimationPolish(
  project: MineMotionProject,
  actorId: string,
  action: AnimationPolishAction,
  startFrame = project.animation.currentFrame,
  durationFrames = Math.max(12, project.animation.fps),
  intensity = 1
): AnimationPolishResult {
  const actor = project.scene.characters.find((character) => character.id === actorId);
  if (!actor) return failure(project, actorId, action, "POLISH_ACTOR_MISSING");
  if (actor.locked) return failure(project, actorId, action, "POLISH_ACTOR_LOCKED");
  const start = Math.max(0, Math.round(startFrame));
  const duration = Math.max(6, Math.round(durationFrames));
  const end = start + duration;
  const strength = Math.max(0.2, Math.min(2, intensity));
  let tracks = project.animation.tracks;
  const trackIds: string[] = [];
  const addBone = (bone: string, entries: Array<[number, Vector3Tuple]>) => {
    const property = `bone.rotation.${bone}` as const;
    tracks = upsert(tracks, actor.id, property, entries);
    trackIds.push(`${actor.id}:${property}`);
  };
  const addTransform = (property: "transform.position" | "transform.rotation", entries: Array<[number, Vector3Tuple]>) => {
    tracks = upsert(tracks, actor.id, property, entries);
    trackIds.push(`${actor.id}:${property}`);
  };
  const quarter = start + Math.round(duration * 0.25);
  const middle = start + Math.round(duration * 0.5);
  const threeQuarter = start + Math.round(duration * 0.75);

  if (action === "breathing") {
    addBone("body", [[start, [0, 0, 0]], [quarter, [-1.5 * strength, 0, 0]], [middle, [0.8 * strength, 0, 0]], [threeQuarter, [-1.2 * strength, 0, 0]], [end, [0, 0, 0]]]);
    addBone("head", [[start, [0, 0, 0]], [middle, [0.6 * strength, 0, 0]], [end, [0, 0, 0]]]);
  } else if (action === "weight-shift") {
    addBone("body", [[start, [0, 0, 0]], [middle, [0, 0, 4 * strength]], [end, [0, 0, 0]]]);
    addTransform("transform.position", [[start, actor.transform.position], [middle, [actor.transform.position[0] + 0.12 * strength, actor.transform.position[1], actor.transform.position[2]]], [end, actor.transform.position]]);
  } else if (action === "look-left" || action === "look-right") {
    const direction = action === "look-left" ? 1 : -1;
    addBone("head", [[start, [0, 0, 0]], [middle, [0, direction * 28 * strength, direction * 1.5]], [end, [0, 0, 0]]]);
    addBone("body", [[start, [0, 0, 0]], [middle, [0, direction * 7 * strength, 0]], [end, [0, 0, 0]]]);
  } else if (action === "anticipation") {
    addBone("body", [[start, [0, 0, 0]], [threeQuarter, [8 * strength, 0, 0]], [end, [-5 * strength, 0, 0]]]);
    addBone("leftArm", [[start, [0, 0, 0]], [threeQuarter, [18 * strength, 0, -8 * strength]], [end, [-12 * strength, 0, 5 * strength]]]);
    addBone("rightArm", [[start, [0, 0, 0]], [threeQuarter, [18 * strength, 0, 8 * strength]], [end, [-12 * strength, 0, -5 * strength]]]);
  } else if (action === "follow-through") {
    addBone("body", [[start, [-6 * strength, 0, 0]], [middle, [4 * strength, 0, 0]], [end, [0, 0, 0]]]);
    addBone("rightArm", [[start, [-35 * strength, 0, -12 * strength]], [middle, [16 * strength, 0, 9 * strength]], [end, [0, 0, 0]]]);
    addBone("head", [[start, [-3 * strength, 0, 0]], [middle, [2 * strength, 0, 0]], [end, [0, 0, 0]]]);
  } else if (action === "recoil") {
    addBone("body", [[start, [0, 0, 0]], [quarter, [-10 * strength, 0, 0]], [middle, [5 * strength, 0, 0]], [end, [0, 0, 0]]]);
    addTransform("transform.position", [[start, actor.transform.position], [quarter, [actor.transform.position[0], actor.transform.position[1], actor.transform.position[2] + 0.35 * strength]], [end, actor.transform.position]]);
  } else {
    addBone("body", [[start, [5 * strength, 0, 2 * strength]], [quarter, [-2.5 * strength, 0, -1 * strength]], [middle, [1.2 * strength, 0, 0.5 * strength]], [end, [0, 0, 0]]]);
    addBone("head", [[start, [-2 * strength, 0, 0]], [middle, [1 * strength, 0, 0]], [end, [0, 0, 0]]]);
  }

  const next = syncCinematicTimeline({
    ...project,
    projectSettings: { ...project.projectSettings, durationFrames: Math.max(project.projectSettings.durationFrames, end) },
    animation: { ...project.animation, durationFrames: Math.max(project.animation.durationFrames, end), tracks },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  });
  return { project: next, changed: true, actorId, action, trackIds: [...new Set(trackIds)], error: null };
}

function upsert(
  tracks: AnimationTrack[],
  targetId: string,
  property: AnimationTrack["property"],
  entries: Array<[number, Vector3Tuple]>
): AnimationTrack[] {
  const id = `${targetId}:${property}`;
  const existing = tracks.find((track) => track.id === id);
  const byFrame = new Map<number, AnimationTrack["keyframes"][number]>();
  for (const keyframe of existing?.keyframes ?? []) byFrame.set(keyframe.frame, keyframe);
  for (const [frame, value] of entries) byFrame.set(frame, { ...createVectorKeyframe(frame, value), interpolation: "ease-in-out" as const });
  const track: AnimationTrack = { id, targetId, property, keyframes: [...byFrame.values()].sort((a, b) => a.frame - b.frame) };
  return existing ? tracks.map((candidate) => candidate.id === id ? track : candidate) : [...tracks, track];
}

function failure(project: MineMotionProject, actorId: string, action: AnimationPolishAction, error: string): AnimationPolishResult {
  return { project, changed: false, actorId, action, trackIds: [], error };
}
