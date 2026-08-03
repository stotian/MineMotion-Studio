import { createBuiltinAudioClip } from "../../audio/AudioClip";
import { getBuiltinSfx } from "../../audio/BuiltinSfxRegistry";
import type { AudioClip, AudioMarker } from "../../audio/AudioTypes";
import { createId } from "../../core/ids/Id";
import type { MineMotionProject } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";

export const SOUND_DESIGN_BEATS = [
  "explosion",
  "sword-fight",
  "lightning",
  "teleport",
  "chase",
  "magic",
  "glitch"
] as const;
export type SoundDesignBeat = (typeof SOUND_DESIGN_BEATS)[number];

export interface SoundDesignResult {
  project: MineMotionProject;
  changed: boolean;
  beat: SoundDesignBeat;
  clipIds: string[];
  markerId: string | null;
  error: string | null;
}

export function createSoundDesignBeat(
  project: MineMotionProject,
  beat: SoundDesignBeat,
  frame = project.animation.currentFrame,
  intensity = 1
): SoundDesignResult {
  const start = Math.max(0, Math.round(frame));
  const amount = Math.max(0.25, Math.min(2, intensity));
  const recipe = recipeFor(beat);
  const clips: AudioClip[] = [];
  for (const layer of recipe) {
    const definition = getBuiltinSfx(layer.sfxId);
    if (!definition) return { project, changed: false, beat, clipIds: [], markerId: null, error: `SFX_DEFINITION_MISSING:${layer.sfxId}` };
    const clip = createBuiltinAudioClip(definition, Math.max(0, start + layer.offsetFrames));
    clips.push({
      ...clip,
      name: `${labelForBeat(beat)} — ${definition.name}`,
      durationFrames: Math.max(2, Math.round(clip.durationFrames * layer.durationScale)),
      volume: Math.max(0, Math.min(1, layer.volume * amount)),
      pan: Math.max(-1, Math.min(1, layer.pan)),
      role: "sfx"
    });
  }
  const marker: AudioMarker = {
    id: createId("sound-beat-marker"),
    name: labelForBeat(beat),
    frame: start,
    type: beat === "chase" ? "action" : "sync",
    color: beat === "chase" ? "#f07878" : "#a78bfa"
  };
  const finalFrame = clips.reduce((max, clip) => Math.max(max, clip.startFrame + clip.durationFrames), start);
  const next = syncCinematicTimeline({
    ...project,
    projectSettings: { ...project.projectSettings, durationFrames: Math.max(project.projectSettings.durationFrames, finalFrame) },
    animation: { ...project.animation, durationFrames: Math.max(project.animation.durationFrames, finalFrame) },
    audio: {
      ...project.audio,
      clips: [...project.audio.clips, ...clips],
      markers: [...project.audio.markers, marker]
    },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  });
  return { project: next, changed: true, beat, clipIds: clips.map((clip) => clip.id), markerId: marker.id, error: null };
}

function recipeFor(beat: SoundDesignBeat): Array<{ sfxId: string; offsetFrames: number; volume: number; pan: number; durationScale: number }> {
  if (beat === "explosion") return [
    layer("impact-hit", -1, 0.8, 0, 0.8),
    layer("deep-boom", 0, 1, 0, 1.5),
    layer("camera-rumble", 3, 0.55, 0, 1.3)
  ];
  if (beat === "sword-fight") return [
    layer("whoosh", -5, 0.55, -0.25, 0.7),
    layer("impact-hit", 0, 0.95, 0.2, 0.8),
    layer("whoosh", 4, 0.45, 0.4, 0.65)
  ];
  if (beat === "lightning") return [
    layer("lightning-crack", 0, 1, 0, 1.2),
    layer("deep-boom", 5, 0.62, 0, 1.4),
    layer("camera-rumble", 7, 0.38, 0, 1.1)
  ];
  if (beat === "teleport") return [
    layer("magic-pulse", -6, 0.55, -0.25, 0.9),
    layer("whoosh", 0, 0.8, 0.2, 0.8),
    layer("magic-pulse", 4, 0.48, 0.25, 1.2)
  ];
  if (beat === "chase") return [
    layer("whoosh", 0, 0.52, -0.45, 1.5),
    layer("camera-rumble", 3, 0.32, 0, 1.8),
    layer("whoosh", 12, 0.48, 0.45, 1.2)
  ];
  if (beat === "magic") return [
    layer("magic-pulse", 0, 0.82, 0, 1.4),
    layer("deep-boom", 5, 0.36, 0, 0.9),
    layer("magic-pulse", 10, 0.5, 0.25, 1.1)
  ];
  return [
    layer("glitch-pop", -2, 0.72, -0.35, 0.8),
    layer("glitch-pop", 1, 0.9, 0.4, 0.6),
    layer("impact-hit", 3, 0.42, 0, 0.5)
  ];
}

function layer(sfxId: string, offsetFrames: number, volume: number, pan: number, durationScale: number) {
  return { sfxId, offsetFrames, volume, pan, durationScale };
}

export function labelForSoundBeat(beat: SoundDesignBeat): string {
  return labelForBeat(beat);
}

function labelForBeat(beat: SoundDesignBeat): string {
  return beat.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
