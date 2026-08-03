import { createId } from "../../core/ids/Id";
import type { AudioClip, AudioMarker, LipSyncCue } from "../../audio/AudioTypes";
import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { applyActorAction } from "./ActorChoreography";
import { buildDirectorSequence, type DirectorSequenceBuildResult } from "./DirectorSequenceBuilder";
import type { DirectorShotRequest } from "./ShotRecipes";

export interface ParsedDialogueLine {
  speaker: string;
  text: string;
  lineNumber: number;
}

export interface ScriptedDialogueOptions {
  script: string;
  primaryActorId: string;
  secondaryActorId: string;
  startFrame?: number;
  wordsPerMinute?: number;
  pauseFrames?: number;
  createCameras?: boolean;
  createMutedAudioPlaceholders?: boolean;
}

export interface ScriptedDialogueResult {
  project: MineMotionProject;
  changed: boolean;
  lines: ParsedDialogueLine[];
  clipIds: string[];
  markerIds: string[];
  lipSyncCueIds: string[];
  shotIds: string[];
  errors: string[];
}

export function parseDialogueScript(script: string): ParsedDialogueLine[] {
  return script
    .split(/\r?\n/)
    .map((raw, index) => ({ raw: raw.trim(), lineNumber: index + 1 }))
    .filter((entry) => entry.raw.length > 0 && !entry.raw.startsWith("#"))
    .flatMap((entry) => {
      const match = entry.raw.match(/^([^:]{1,80}):\s*(.+)$/);
      if (!match) return [];
      const speaker = match[1].trim();
      const text = match[2].trim();
      return speaker && text ? [{ speaker, text, lineNumber: entry.lineNumber }] : [];
    });
}

export function createScriptedDialogueScene(
  project: MineMotionProject,
  options: ScriptedDialogueOptions
): ScriptedDialogueResult {
  const lines = parseDialogueScript(options.script);
  const errors: string[] = [];
  if (lines.length === 0) return empty(project, lines, ["DIALOGUE_SCRIPT_HAS_NO_VALID_LINES"]);
  const primary = project.scene.characters.find((actor) => actor.id === options.primaryActorId);
  const secondary = project.scene.characters.find((actor) => actor.id === options.secondaryActorId);
  if (!primary || !secondary || primary.id === secondary.id) {
    return empty(project, lines, ["SCRIPTED_DIALOGUE_REQUIRES_TWO_DISTINCT_ACTORS"]);
  }

  const fps = Math.max(1, project.animation.fps);
  const wordsPerMinute = Math.max(60, Math.min(260, options.wordsPerMinute ?? 145));
  const pauseFrames = Math.max(0, Math.round(options.pauseFrames ?? Math.round(fps * 0.35)));
  const startFrame = Math.max(0, Math.round(options.startFrame ?? project.animation.currentFrame));
  const speakerLookup = createSpeakerLookup(primary, secondary);
  const clips: AudioClip[] = [];
  const markers: AudioMarker[] = [];
  const cues: LipSyncCue[] = [];
  const requests: DirectorShotRequest[] = [];
  let next = project;
  let cursor = startFrame;

  for (const [index, line] of lines.entries()) {
    const actor = resolveSpeaker(line.speaker, primary, secondary, speakerLookup, index);
    const listener = actor.id === primary.id ? secondary : primary;
    const durationFrames = dialogueDurationFrames(line.text, fps, wordsPerMinute);
    const endFrame = cursor + durationFrames;
    const clipId = createId("dialogue-placeholder");
    clips.push(createDialoguePlaceholder(clipId, actor.name, line.text, cursor, durationFrames, options.createMutedAudioPlaceholders !== false));
    markers.push({
      id: createId("dialogue-marker"),
      name: `${actor.name}: ${truncate(line.text, 58)}`,
      frame: cursor,
      type: "dialogue",
      color: "#66b3ff"
    });
    cues.push(...createTextLipSyncCues(clipId, line.text, cursor, durationFrames));

    const performance = applyActorAction(next, {
      kind: "idle",
      actorId: actor.id,
      targetActorId: listener.id,
      startFrame: cursor,
      durationFrames,
      intensity: 0.72 + Math.min(0.45, punctuationEnergy(line.text))
    });
    if (performance.changed) next = performance.project;
    const listenerPerformance = applyActorAction(next, {
      kind: "idle",
      actorId: listener.id,
      targetActorId: actor.id,
      startFrame: cursor,
      durationFrames,
      intensity: 0.38
    });
    if (listenerPerformance.changed) next = listenerPerformance.project;

    if (options.createCameras !== false) {
      requests.push({
        kind: index === 0 ? "two-shot" : actor.id === primary.id ? "over-shoulder-left" : "over-shoulder-right",
        subjectIds: [actor.id, listener.id],
        startFrame: cursor,
        durationFrames,
        name: `${actor.name} — ${truncate(line.text, 36)}`
      });
      if (durationFrames >= fps * 4 && /[!?]/.test(line.text)) {
        const reactionDuration = Math.max(Math.round(fps * 0.8), Math.round(durationFrames * 0.25));
        requests.push({
          kind: "close-up",
          subjectIds: [listener.id],
          startFrame: Math.max(cursor, endFrame - reactionDuration),
          durationFrames: reactionDuration,
          name: `${listener.name} reaction`
        });
      }
    }
    cursor = endFrame + pauseFrames;
  }

  next = {
    ...next,
    projectSettings: {
      ...next.projectSettings,
      durationFrames: Math.max(next.projectSettings.durationFrames, Math.max(startFrame, cursor - pauseFrames))
    },
    animation: {
      ...next.animation,
      durationFrames: Math.max(next.animation.durationFrames, Math.max(startFrame, cursor - pauseFrames))
    },
    audio: {
      ...next.audio,
      clips: [...next.audio.clips, ...clips],
      markers: [...next.audio.markers, ...markers],
      lipSyncCues: [...next.audio.lipSyncCues, ...cues]
    },
    metadata: { ...next.metadata, updatedAt: new Date().toISOString() }
  };

  let sequence: DirectorSequenceBuildResult | null = null;
  if (requests.length > 0) {
    sequence = buildDirectorSequence(next, {
      name: "Scripted dialogue",
      requests,
      replaceExisting: false
    });
    next = sequence.project;
  }
  next = syncCinematicTimeline(next);
  return {
    project: next,
    changed: true,
    lines,
    clipIds: clips.map((clip) => clip.id),
    markerIds: markers.map((marker) => marker.id),
    lipSyncCueIds: cues.map((cue) => cue.id),
    shotIds: sequence?.createdShotIds ?? [],
    errors
  };
}

export function createTextLipSyncCues(
  clipId: string,
  text: string,
  startFrame: number,
  durationFrames: number
): LipSyncCue[] {
  const tokens = text.match(/[A-Za-zÀ-ÿ0-9']+/g) ?? [];
  if (tokens.length === 0) return [];
  const spacing = durationFrames / Math.max(1, tokens.length);
  const cues: LipSyncCue[] = [];
  tokens.forEach((token, index) => {
    const phonemes = phonemesForToken(token);
    phonemes.forEach((phoneme, phonemeIndex) => {
      const local = index * spacing + (phonemeIndex / Math.max(1, phonemes.length)) * spacing;
      cues.push({
        id: createId("lip-cue"),
        clipId,
        frame: Math.max(0, Math.round(startFrame + local)),
        phoneme,
        intensity: phoneme === "M" ? 0.55 : phoneme === "O" ? 0.88 : 0.72,
        source: "marker-import"
      });
    });
  });
  return cues.sort((a, b) => a.frame - b.frame);
}

function dialogueDurationFrames(text: string, fps: number, wordsPerMinute: number): number {
  const words = Math.max(1, (text.match(/[A-Za-zÀ-ÿ0-9']+/g) ?? []).length);
  const spokenSeconds = words / (wordsPerMinute / 60);
  const punctuationPause = (text.match(/[,.!?;:]/g) ?? []).length * 0.12;
  return Math.max(Math.round(fps * 1.1), Math.round((spokenSeconds + punctuationPause) * fps));
}

function createDialoguePlaceholder(
  id: string,
  speakerName: string,
  text: string,
  startFrame: number,
  durationFrames: number,
  muted: boolean
): AudioClip {
  return {
    id,
    name: `${speakerName}: ${truncate(text, 72)}`,
    sourceKind: "builtin-placeholder",
    sourceName: `dialogue:${speakerName}`,
    mimeType: "application/x-minemotion-dialogue-placeholder",
    dataUrl: "",
    startFrame,
    durationFrames,
    sourceOffsetFrames: 0,
    fadeInFrames: 0,
    fadeOutFrames: 0,
    volume: 0.8,
    pan: 0,
    muted,
    loop: false,
    role: "dialogue",
    peak: null,
    integratedLoudnessLufs: null,
    waveformHash: "",
    decodeStatus: "ready",
    importedAt: new Date().toISOString()
  };
}

function createSpeakerLookup(
  primary: MineMotionProject["scene"]["characters"][number],
  secondary: MineMotionProject["scene"]["characters"][number]
): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const actor of [primary, secondary]) {
    lookup.set(normalize(actor.id), actor.id);
    lookup.set(normalize(actor.name), actor.id);
    lookup.set(normalize(actor.name.split(/\s+/)[0]), actor.id);
  }
  lookup.set("a", primary.id);
  lookup.set("1", primary.id);
  lookup.set("primary", primary.id);
  lookup.set("principal", primary.id);
  lookup.set("b", secondary.id);
  lookup.set("2", secondary.id);
  lookup.set("secondary", secondary.id);
  lookup.set("secondaire", secondary.id);
  return lookup;
}

function resolveSpeaker(
  speaker: string,
  primary: MineMotionProject["scene"]["characters"][number],
  secondary: MineMotionProject["scene"]["characters"][number],
  lookup: Map<string, string>,
  index: number
) {
  const id = lookup.get(normalize(speaker));
  if (id === primary.id) return primary;
  if (id === secondary.id) return secondary;
  return index % 2 === 0 ? primary : secondary;
}

function phonemesForToken(token: string): string[] {
  const lower = token.toLowerCase();
  const result: string[] = [];
  if (/^[mbp]/.test(lower)) result.push("M");
  if (/[ouôö]/.test(lower)) result.push("O");
  if (/[aàâäeéèêëiîïy]/.test(lower)) result.push("A");
  if (/[fvszxjch]/.test(lower)) result.push("F");
  if (/[lrtdnkqg]/.test(lower)) result.push("L");
  return result.length > 0 ? result.slice(0, 3) : ["A"];
}

function punctuationEnergy(text: string): number {
  return Math.min(1, (text.match(/[!?]/g) ?? []).length * 0.25 + (text.match(/[A-ZÀ-Ý]{3,}/g) ?? []).length * 0.2);
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, Math.max(1, max - 1)).trim()}…`;
}

function empty(project: MineMotionProject, lines: ParsedDialogueLine[], errors: string[]): ScriptedDialogueResult {
  return { project, changed: false, lines, clipIds: [], markerIds: [], lipSyncCueIds: [], shotIds: [], errors };
}
