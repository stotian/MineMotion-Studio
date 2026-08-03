import type { MineMotionProject } from "../../project/ProjectFile";

export interface ProductionTextArtifact {
  filename: string;
  mimeType: string;
  content: string;
}

export function createShotListCsv(project: MineMotionProject): ProductionTextArtifact {
  const shots = activeShots(project);
  const rows = [
    ["shot_id", "name", "take", "start_frame", "end_frame", "duration_frames", "camera", "status", "notes"],
    ...shots.map((shot) => [
      shot.id,
      shot.name,
      String(shot.takeNumber),
      String(shot.startFrame),
      String(shot.endFrame),
      String(shot.endFrame - shot.startFrame + 1),
      project.scene.cameras.find((camera) => camera.id === shot.cameraId)?.name ?? shot.cameraId,
      shot.status,
      shot.notes
    ])
  ];
  return {
    filename: `${safeName(project.projectName)}-shot-list.csv`,
    mimeType: "text/csv;charset=utf-8",
    content: rows.map((row) => row.map(csvCell).join(",")).join("\n")
  };
}

export function createEditDecisionList(project: MineMotionProject): ProductionTextArtifact {
  const fps = Math.max(1, project.animation.fps);
  const lines = [`TITLE: ${project.projectName}`, "FCM: NON-DROP FRAME", ""];
  activeShots(project).forEach((shot, index) => {
    const reel = `CAM${String(index + 1).padStart(3, "0")}`.slice(0, 8);
    const sourceIn = timecode(0, fps);
    const sourceOut = timecode(shot.endFrame - shot.startFrame + 1, fps);
    const recordIn = timecode(shot.startFrame, fps);
    const recordOut = timecode(shot.endFrame + 1, fps);
    lines.push(`${String(index + 1).padStart(3, "0")}  ${reel.padEnd(8)} V     C        ${sourceIn} ${sourceOut} ${recordIn} ${recordOut}`);
    lines.push(`* FROM CLIP NAME: ${shot.name}`);
    lines.push(`* CAMERA: ${project.scene.cameras.find((camera) => camera.id === shot.cameraId)?.name ?? shot.cameraId}`);
  });
  return {
    filename: `${safeName(project.projectName)}.edl`,
    mimeType: "text/plain;charset=utf-8",
    content: lines.join("\n")
  };
}

export function createStoryboardMarkdown(project: MineMotionProject): ProductionTextArtifact {
  const shots = activeShots(project);
  const byShot = new Map(project.production.storyboard.flatMap((card) => card.shotId ? [[card.shotId, card] as const] : []));
  const lines = [`# ${project.projectName} — Storyboard`, "", `FPS: ${project.animation.fps}`, ""];
  shots.forEach((shot, index) => {
    const card = byShot.get(shot.id);
    lines.push(`## ${index + 1}. ${shot.name}`);
    lines.push(`- Frames: ${shot.startFrame}–${shot.endFrame}`);
    lines.push(`- Camera: ${project.scene.cameras.find((camera) => camera.id === shot.cameraId)?.name ?? shot.cameraId}`);
    lines.push(`- Status: ${shot.status}`);
    if (shot.notes) lines.push(`- Shot notes: ${shot.notes}`);
    if (card?.notes) lines.push(`- Storyboard notes: ${card.notes}`);
    lines.push("");
  });
  const freeCards = project.production.storyboard.filter((card) => !card.shotId);
  if (freeCards.length > 0) {
    lines.push("## Free planning cards", "");
    freeCards.forEach((card) => lines.push(`- **${card.title}** — ${card.notes || "No notes"}`));
  }
  return {
    filename: `${safeName(project.projectName)}-storyboard.md`,
    mimeType: "text/markdown;charset=utf-8",
    content: lines.join("\n")
  };
}

export function createDialogueRecordingScript(project: MineMotionProject): ProductionTextArtifact {
  const dialogue = project.audio.clips
    .filter((clip) => clip.role === "dialogue")
    .sort((a, b) => a.startFrame - b.startFrame);
  const lines = [`# ${project.projectName} — Dialogue recording script`, "", `FPS: ${project.animation.fps}`, ""];
  dialogue.forEach((clip, index) => {
    lines.push(`## Line ${index + 1} — ${timecode(clip.startFrame, project.animation.fps)}`);
    lines.push(clip.name);
    lines.push(`Duration: ${clip.durationFrames} frames (${(clip.durationFrames / Math.max(1, project.animation.fps)).toFixed(2)} s)`);
    const cues = project.audio.lipSyncCues.filter((cue) => cue.clipId === clip.id);
    if (cues.length > 0) lines.push(`Lip-sync guide: ${cues.map((cue) => cue.phoneme).join(" ")}`);
    lines.push("");
  });
  if (dialogue.length === 0) lines.push("No dialogue placeholders or imported dialogue clips are currently scheduled.");
  return {
    filename: `${safeName(project.projectName)}-dialogue.md`,
    mimeType: "text/markdown;charset=utf-8",
    content: lines.join("\n")
  };
}

export function createProductionManifest(project: MineMotionProject): ProductionTextArtifact {
  const shots = activeShots(project);
  const payload = {
    schema: "minemotion.production-manifest/1",
    projectName: project.projectName,
    fps: project.animation.fps,
    durationFrames: project.animation.durationFrames,
    activeCameraId: project.activeCameraId,
    characters: project.scene.characters.map((actor) => ({ id: actor.id, name: actor.name, rigPreset: actor.rigPreset })),
    shots: shots.map((shot) => ({
      id: shot.id,
      name: shot.name,
      cameraId: shot.cameraId,
      startFrame: shot.startFrame,
      endFrame: shot.endFrame,
      takeNumber: shot.takeNumber,
      status: shot.status,
      renderPasses: shot.renderPasses
    })),
    dialogueClips: project.audio.clips.filter((clip) => clip.role === "dialogue").map((clip) => ({ id: clip.id, name: clip.name, startFrame: clip.startFrame, durationFrames: clip.durationFrames })),
    effects: project.effects.instances.filter((effect) => effect.enabled).map((effect) => ({ id: effect.id, type: effect.type, startFrame: effect.startFrame, durationFrames: effect.durationFrames })),
    render: project.renderSettings,
    export: project.exportSettings
  };
  return {
    filename: `${safeName(project.projectName)}-production-manifest.json`,
    mimeType: "application/json;charset=utf-8",
    content: JSON.stringify(payload, null, 2)
  };
}

function activeShots(project: MineMotionProject) {
  return project.production.shots
    .filter((shot) => shot.enabled && shot.activeTake)
    .sort((a, b) => a.startFrame - b.startFrame || a.name.localeCompare(b.name));
}

function timecode(frame: number, fps: number): string {
  const safeFps = Math.max(1, Math.round(fps));
  const total = Math.max(0, Math.round(frame));
  const frames = total % safeFps;
  const secondsTotal = Math.floor(total / safeFps);
  const seconds = secondsTotal % 60;
  const minutesTotal = Math.floor(secondsTotal / 60);
  const minutes = minutesTotal % 60;
  const hours = Math.floor(minutesTotal / 60);
  return [hours, minutes, seconds, frames].map((value) => String(value).padStart(2, "0")).join(":");
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

function safeName(value: string): string {
  return (value.trim() || "minemotion-film").replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "minemotion-film";
}
