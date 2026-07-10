import type {
  AnimationTrack,
  KeyframeInterpolation,
  Vector3Tuple
} from "../../project/ProjectFile";
import {
  locateKeyframe,
  type KeyframeRef
} from "./KeyframeModel";

interface GraphEditorProps {
  tracks: AnimationTrack[];
  selection: KeyframeRef[];
  durationFrames: number;
  onSetInterpolation: (interpolation: KeyframeInterpolation) => void;
}

const CHANNELS = [
  { index: 0, label: "X", color: "#ff6b6b" },
  { index: 1, label: "Y", color: "#65d889" },
  { index: 2, label: "Z", color: "#6da8ff" }
] as const;

export function GraphEditor({
  tracks,
  selection,
  durationFrames,
  onSetInterpolation
}: GraphEditorProps) {
  const located = selection[0] ? locateKeyframe(tracks, selection[0]) : null;
  const track = located?.track ?? null;

  if (!track || track.keyframes.length === 0) {
    return <p className="timeline-empty">Select a keyframe to inspect its property curves.</p>;
  }

  const bounds = valueBounds(track);
  const interpolation = located?.keyframe.interpolation ?? "linear";
  return (
    <div className="graph-editor">
      <div className="graph-toolbar">
        <strong>{track.property}</strong>
        <label>
          Interpolation
          <select
            value={interpolation}
            onChange={(event) =>
              onSetInterpolation(event.target.value as KeyframeInterpolation)
            }
          >
            <option value="constant">Constant</option>
            <option value="linear">Linear</option>
            <option value="ease-in">Ease In</option>
            <option value="ease-out">Ease Out</option>
            <option value="ease-in-out">Ease In Out</option>
            <option value="bezier">Bezier Placeholder</option>
          </select>
        </label>
        <div className="graph-legend">
          {CHANNELS.map((channel) => (
            <span key={channel.label} style={{ color: channel.color }}>
              {channel.label}
            </span>
          ))}
        </div>
      </div>
      <svg
        className="graph-canvas"
        viewBox="0 0 1000 180"
        role="img"
        aria-label={`${track.property} animation curves`}
      >
        <path d="M0 45 H1000 M0 90 H1000 M0 135 H1000" className="graph-grid" />
        {CHANNELS.map((channel) => (
          <g key={channel.label}>
            <polyline
              fill="none"
              stroke={channel.color}
              strokeWidth="2"
              points={curvePoints(
                track,
                channel.index,
                Math.max(1, durationFrames),
                bounds
              )}
            />
            {track.keyframes.map((keyframe) => (
              <circle
                key={`${channel.label}_${keyframe.id ?? keyframe.frame}`}
                cx={(keyframe.frame / Math.max(1, durationFrames)) * 1000}
                cy={valueY(keyframe.value[channel.index], bounds)}
                r="3.5"
                fill={channel.color}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

function valueBounds(track: AnimationTrack): { min: number; max: number } {
  const values = track.keyframes.flatMap((keyframe) => [...keyframe.value]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return { min: min - 1, max: max + 1 };
  const padding = (max - min) * 0.1;
  return { min: min - padding, max: max + padding };
}

function curvePoints(
  track: AnimationTrack,
  channel: 0 | 1 | 2,
  duration: number,
  bounds: { min: number; max: number }
): string {
  return track.keyframes
    .map(
      (keyframe) =>
        `${(keyframe.frame / duration) * 1000},${valueY(keyframe.value[channel], bounds)}`
    )
    .join(" ");
}

function valueY(value: number, bounds: { min: number; max: number }): number {
  return 170 - ((value - bounds.min) / (bounds.max - bounds.min)) * 160;
}
