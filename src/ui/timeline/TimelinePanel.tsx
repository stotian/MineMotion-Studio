import { Pause, Play, SkipBack } from "lucide-react";
import type { MineMotionProject } from "../../project/ProjectFile";

interface TimelinePanelProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  onSetFrame: (frame: number) => void;
  onSetFps: (fps: number) => void;
  onTogglePlayback: () => void;
  onAddKeyframe: () => void;
}

export function TimelinePanel({
  project,
  selectedObjectId,
  onSetFrame,
  onSetFps,
  onTogglePlayback,
  onAddKeyframe
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
          {animation.tracks.length} tracks / {selectedTracks.length} selected
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
      </div>
    </footer>
  );
}

