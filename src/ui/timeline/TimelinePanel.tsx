import { Pause, Play, SkipBack } from "lucide-react";
import type { MineMotionProject, TimelineItem } from "../../project/ProjectFile";

interface TimelinePanelProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  selectedEffectId: string | null;
  onSetFrame: (frame: number) => void;
  onSetFps: (fps: number) => void;
  onTogglePlayback: () => void;
  onAddKeyframe: () => void;
  onSelectEffect: (effectId: string) => void;
}

export function TimelinePanel({
  project,
  selectedObjectId,
  selectedEffectId,
  onSetFrame,
  onSetFps,
  onTogglePlayback,
  onAddKeyframe,
  onSelectEffect
}: TimelinePanelProps) {
  const { animation } = project;
  const selectedTracks = selectedObjectId
    ? animation.tracks.filter((track) => track.targetId === selectedObjectId)
    : [];
  const markerFrames = new Set(
    selectedTracks.flatMap((track) => track.keyframes.map((keyframe) => keyframe.frame))
  );
  const ticks = Array.from({ length: 31 }, (_, index) =>
    Math.round((animation.durationFrames / 30) * index)
  );
  const effectTrack = animation.timelineTracks.find(
    (track) => track.type === "effect"
  );
  const audioTrack = animation.timelineTracks.find(
    (track) => track.type === "audio"
  );

  return (
    <footer className="timeline-panel">
      <div className="timeline-controls">
        <button type="button" onClick={() => onSetFrame(0)} title="Go to start">
          <SkipBack size={15} />
        </button>
        <button type="button" onClick={onTogglePlayback}>
          {animation.isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {animation.isPlaying ? "Pause" : "Play"}
        </button>
        <label>
          Frame
          <input
            type="number"
            min={0}
            max={animation.durationFrames}
            value={animation.currentFrame}
            onChange={(event) => onSetFrame(Number(event.target.value))}
          />
        </label>
        <label>
          FPS
          <input
            type="number"
            min={1}
            max={120}
            value={animation.fps}
            onChange={(event) => onSetFps(Number(event.target.value))}
          />
        </label>
        <button type="button" disabled={!selectedObjectId} onClick={onAddKeyframe}>
          Add Transform Keyframe
        </button>
        <span className="timeline-summary">
          {animation.tracks.length} transform tracks /{" "}
          {project.effects.instances.length} effects / {project.audio.clips.length} audio
        </span>
      </div>
      <div className="timeline-track">
        <input
          aria-label="Timeline scrubber"
          type="range"
          min={0}
          max={animation.durationFrames}
          value={animation.currentFrame}
          onChange={(event) => onSetFrame(Number(event.target.value))}
        />
        <div className="timeline-ruler">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="keyframe-lane">
          {Array.from(markerFrames).map((frame) => (
            <button
              key={frame}
              type="button"
              className="keyframe-marker"
              style={{
                left: `${(frame / animation.durationFrames) * 100}%`
              }}
              title={`Frame ${frame}`}
              onClick={() => onSetFrame(frame)}
            />
          ))}
        </div>
        <TimelineBlockLane
          label="Effects"
          durationFrames={animation.durationFrames}
          items={effectTrack?.items ?? []}
          selectedEffectId={selectedEffectId}
          onSetFrame={onSetFrame}
          onSelectEffect={onSelectEffect}
        />
        <TimelineBlockLane
          label="Audio"
          durationFrames={animation.durationFrames}
          items={audioTrack?.items ?? []}
          selectedEffectId={null}
          onSetFrame={onSetFrame}
          onSelectEffect={onSelectEffect}
        />
      </div>
    </footer>
  );
}

function TimelineBlockLane({
  label,
  durationFrames,
  items,
  selectedEffectId,
  onSetFrame,
  onSelectEffect
}: {
  label: string;
  durationFrames: number;
  items: TimelineItem[];
  selectedEffectId: string | null;
  onSetFrame: (frame: number) => void;
  onSelectEffect: (effectId: string) => void;
}) {
  return (
    <div className="timeline-block-lane" aria-label={`${label} lane`}>
      <span>{label}</span>
      <div>
        {items.map((item) => {
          const left = (item.startFrame / durationFrames) * 100;
          const width = Math.max(1, (item.durationFrames / durationFrames) * 100);
          return (
            <button
              key={item.id}
              type="button"
              className={`timeline-block ${item.effectId === selectedEffectId ? "selected" : ""} ${item.type}`}
              style={{
                left: `${left}%`,
                width: `${width}%`
              }}
              title={`${item.label} @ ${item.startFrame}`}
              onClick={() => {
                onSetFrame(item.startFrame);
                if (item.effectId) {
                  onSelectEffect(item.effectId);
                }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
