import { useMemo, useState } from "react";
import { Music2, Plus, Trash2, X } from "lucide-react";
import type { MineMotionProject } from "../../project/ProjectFile";
import { analyzeAudioClip } from "../../audio/AudioAnalysis";
import { addAudioMarker, removeAudioClip, updateAudioClip } from "../../audio/AudioEditor";
import { createAudioHandoffMetadata } from "../../audio/AudioHandoff";
import { createAudioMarker } from "../../audio/AudioMarkers";
import type { AudioTrackRole } from "../../audio/AudioTypes";
import { useLocalization } from "../../localization/LocalizationContext";

export interface AudioWorkspacePanelProps {
  open: boolean;
  project: MineMotionProject;
  onProjectChange: (project: MineMotionProject) => void;
  onClose: () => void;
}

const ROLES: AudioTrackRole[] = ["dialogue", "sfx", "music", "ambience"];

export function AudioWorkspacePanel({ open, project, onProjectChange, onClose }: AudioWorkspacePanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [markerName, setMarkerName] = useState("");
  const warnings = useMemo(() => project.audio.clips.flatMap(analyzeAudioClip), [project.audio.clips]);
  if (!open) return null;
  const setAudio = (audio: MineMotionProject["audio"]) => onProjectChange({ ...project, audio, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } });
  const handoff = createAudioHandoffMetadata(project);
  return (
    <div className="modal-backdrop">
      <section className="modal-panel audio-workspace-panel" role="dialog" aria-modal="true" aria-labelledby="audio-workspace-title">
        <header className="panel-header"><div><h2 id="audio-workspace-title"><Music2 size={19} /> {t("audio.workspace.title")}</h2><p>{t("audio.workspace.subtitle")}</p></div><button type="button" onClick={onClose} aria-label={t("common.close")}><X size={18} /></button></header>
        <div className="audio-workspace-summary"><span>{t("audio.workspace.clips", { count: project.audio.clips.length })}</span><span>{t("audio.workspace.warnings", { count: warnings.length })}</span><span>{t("audio.workspace.stems", { count: handoff.stems.length })}</span></div>
        <div className="audio-clip-list">
          {project.audio.clips.map((clip) => (
            <article key={clip.id} className="audio-clip-editor">
              <strong>{clip.name}</strong>
              <label>{t("audio.workspace.role")}<select value={clip.role} onChange={(event) => setAudio(updateAudioClip(project.audio, clip.id, { role: event.target.value as AudioTrackRole }))}>{ROLES.map((role) => <option key={role} value={role}>{t(`audio.role.${role}`)}</option>)}</select></label>
              <label>{t("audio.workspace.start")}<input type="number" min={0} value={clip.startFrame} onChange={(event) => setAudio(updateAudioClip(project.audio, clip.id, { startFrame: Number(event.target.value) }))} /></label>
              <label>{t("audio.workspace.offset")}<input type="number" min={0} value={clip.sourceOffsetFrames} onChange={(event) => setAudio(updateAudioClip(project.audio, clip.id, { sourceOffsetFrames: Number(event.target.value) }))} /></label>
              <label>{t("audio.workspace.fadeIn")}<input type="number" min={0} value={clip.fadeInFrames} onChange={(event) => setAudio(updateAudioClip(project.audio, clip.id, { fadeInFrames: Number(event.target.value) }))} /></label>
              <label>{t("audio.workspace.fadeOut")}<input type="number" min={0} value={clip.fadeOutFrames} onChange={(event) => setAudio(updateAudioClip(project.audio, clip.id, { fadeOutFrames: Number(event.target.value) }))} /></label>
              <label>{t("audio.workspace.gain")}<input type="number" min={0} max={2} step={0.05} value={clip.volume} onChange={(event) => setAudio(updateAudioClip(project.audio, clip.id, { volume: Number(event.target.value) }))} /></label>
              <label><input type="checkbox" checked={clip.muted} onChange={(event) => setAudio(updateAudioClip(project.audio, clip.id, { muted: event.target.checked }))} />{t("audio.workspace.mute")}</label>
              <button type="button" onClick={() => setAudio(removeAudioClip(project.audio, clip.id))}><Trash2 size={14} />{t("common.remove")}</button>
            </article>
          ))}
        </div>
        <div className="audio-marker-editor"><input value={markerName} onChange={(event) => setMarkerName(event.target.value)} placeholder={t("audio.workspace.markerName")} /><button type="button" onClick={() => { setAudio(addAudioMarker(project.audio, createAudioMarker(markerName, project.animation.currentFrame, "sync"))); setMarkerName(""); }}><Plus size={14} />{t("audio.workspace.addMarker")}</button></div>
      </section>
    </div>
  );
}
