import { spawnEffectAtFrame } from "../../effects/EffectSpawner";
import { MAX_EFFECT_INSTANCES, type EffectInstance } from "../../effects/EffectTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";

export const SHOT_TRANSITION_KINDS = [
  "whip-pan",
  "impact-cut",
  "fade-black",
  "flash-cut",
  "glitch-cut"
] as const;
export type ShotTransitionKind = (typeof SHOT_TRANSITION_KINDS)[number];

export interface ShotTransitionResult {
  project: MineMotionProject;
  changed: boolean;
  transition: ShotTransitionKind;
  effectIds: string[];
  error: string | null;
}

export function applyShotTransition(
  project: MineMotionProject,
  shotId: string,
  transition: ShotTransitionKind,
  intensity = 1
): ShotTransitionResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return failure(project, transition, "TRANSITION_SHOT_MISSING");
  const frame = Math.max(0, shot.startFrame);
  const amount = Math.max(0.25, Math.min(2, intensity));
  const effects: EffectInstance[] = [];
  const add = (type: Parameters<typeof spawnEffectAtFrame>[0], offset: number, parameters: EffectInstance["parameters"]) => {
    const base = spawnEffectAtFrame(type, Math.max(0, frame + offset), "");
    effects.push({ ...base, parameters: { ...base.parameters, ...parameters } });
  };
  if (transition === "whip-pan") {
    add("speedLines", -3, { alpha: 0.55 * amount, speed: 2 * amount, direction: "left" });
    add("cameraShake", -2, { strength: 0.32 * amount, frequency: 20, decay: 0.7 });
  } else if (transition === "impact-cut") {
    add("impactFrame", 0, { alpha: 0.8, contrast: 1.7 * amount });
    add("cameraShake", 0, { strength: 0.7 * amount, decay: 0.85 });
    add("hitStop", 0, { alpha: 0.22 * amount });
  } else if (transition === "fade-black") {
    add("nativeScreenFlash", -Math.max(2, Math.round(project.animation.fps * 0.25)), { color: "#000000", alpha: Math.min(1, 0.9 * amount) });
    add("nativeScreenFlash", 0, { color: "#000000", alpha: Math.min(1, 0.72 * amount) });
  } else if (transition === "flash-cut") {
    add("flash", 0, { color: "#ffffff", alpha: Math.min(1, 0.92 * amount) });
    add("screenBloom", 1, { alpha: 0.45 * amount });
  } else {
    add("screenGlitch", -1, { strength: 0.8 * amount, frequency: 16 });
    add("colorDrain", 0, { alpha: 0.38 * amount });
  }
  if (project.effects.instances.length + effects.length > MAX_EFFECT_INSTANCES) return failure(project, transition, "TRANSITION_EFFECT_LIMIT_REACHED");
  const next = syncCinematicTimeline({
    ...project,
    effects: { ...project.effects, instances: [...project.effects.instances, ...effects] },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  });
  return { project: next, changed: true, transition, effectIds: effects.map((effect) => effect.id), error: null };
}

function failure(project: MineMotionProject, transition: ShotTransitionKind, error: string): ShotTransitionResult {
  return { project, changed: false, transition, effectIds: [], error };
}
