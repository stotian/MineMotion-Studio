import { useMemo, useState } from "react";
import {
  ChartSpline,
  Clipboard,
  Copy,
  DiamondPlus,
  Layers3,
  ListTree,
  Pause,
  Play,
  Scissors,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
  Trash2
} from "lucide-react";
import type {
  KeyframeInterpolation,
  MineMotionProject,
  ReusableAnimationClip,
  TimelineData,
  TimelineItem
} from "../../project/ProjectFile";
import { findObject } from "../../project/ProjectStore";
import { getSelectedCharacterId } from "../../rigs/RigSelection";
import { createAnimationEditorState } from "../../animation/editor/AnimationEditorStore";
import { copyKeyframes, pasteKeyframes } from "../../animation/editor/KeyframeClipboard";
import {
  deleteSelectedKeyframes,
  duplicateSelectedKeyframes,
  moveSelectedKeyframes,
  scaleSelectedKeyframeTiming,
  setSelectedInterpolation,
  snapSelectedKeyframes
} from "../../animation/editor/KeyframeCommands";
import type { KeyframeRef } from "../../animation/editor/KeyframeModel";
import { EMPTY_KEYFRAME_SELECTION } from "../../animation/editor/KeyframeSelection";
import { createTimelineMarker, upsertMarker } from "../../animation/editor/Markers";
import {
  applyAnimationClip,
  createAnimationClip,
  isAnimationClipCompatible
} from "../../animation/editor/ClipSystem";
import { addClipToNla, updateNlaClip } from "../../animation/editor/NlaTracks";
import { Dopesheet } from "../../animation/editor/Dopesheet";
import { GraphEditor } from "../../animation/editor/GraphEditor";

interface TimelinePanelProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  selectedEffectId: string | null;
  onSetFrame: (frame: number) => void;
  onSetFps: (fps: number) => void;
  onTogglePlayback: () => void;
  onAddKeyframe: () => void;
  onSelectEffect: (effectId: string) => void;
  onUpdateAnimation: (animation: TimelineData, label: string) => void;
}

export function TimelinePanel({
  project,
  selectedObjectId,
  selectedEffectId,
  onSetFrame,
  onSetFps,
  onTogglePlayback,
  onAddKeyframe,
  onSelectEffect,
  onUpdateAnimation
}: TimelinePanelProps) {
  const { animation } = project;
  const [editor, setEditor] = useState(createAnimationEditorState);
  const [selectedClipId, setSelectedClipId] = useState("");
  const selectedTargetId = getSelectedCharacterId(selectedObjectId) ?? selectedObjectId;
  const selectedTracks = selectedTargetId
    ? animation.tracks.filter((track) => track.targetId === selectedTargetId)
    : [];
  const keyframeFrames = useMemo(
    () =>
      [...new Set(animation.tracks.flatMap((track) => track.keyframes.map((key) => key.frame)))].sort(
        (left, right) => left - right
      ),
    [animation.tracks]
  );
  const clip = animation.clips.find((candidate) => candidate.id === selectedClipId) ?? null;
  const selectedEntity = selectedTargetId ? findObject(project, selectedTargetId)?.entity : null;
  const selectedTargetType: ReusableAnimationClip["targetType"] =
    selectedEntity?.type === "character"
      ? "character"
      : selectedEntity?.type === "camera"
        ? "camera"
        : "object";
  const clipCompatible = Boolean(
    clip && selectedTargetId && isAnimationClipCompatible(clip, selectedTargetType)
  );

  const commitTracks = (
    tracks: TimelineData["tracks"],
    label: string,
    selection = editor.selection
  ) => {
    onUpdateAnimation({ ...animation, tracks }, label);
    setEditor((current) => ({ ...current, selection }));
  };

  const moveSelection = (refs: KeyframeRef[], deltaFrames: number) => {
    let tracks = moveSelectedKeyframes(
      animation.tracks,
      refs,
      deltaFrames,
      animation.durationFrames
    );
    if (editor.snapEnabled) {
      tracks = snapSelectedKeyframes(
        tracks,
        refs,
        editor.snapInterval,
        animation.durationFrames
      );
    }
    commitTracks(tracks, "Move keyframes", { selected: refs, anchor: refs[0] ?? null });
  };

  const addMarker = () => {
    const name = window.prompt("Marker name", `Marker ${animation.markers.length + 1}`);
    if (!name) return;
    onUpdateAnimation(
      {
        ...animation,
        markers: upsertMarker(
          animation.markers,
          createTimelineMarker(name, animation.currentFrame)
        )
      },
      "Add timeline marker"
    );
  };

  const saveClip = () => {
    const name = window.prompt("Animation clip name", "Reusable Clip");
    if (!name) return;
    const entity = selectedTargetId ? findObject(project, selectedTargetId)?.entity : null;
    const targetType: ReusableAnimationClip["targetType"] =
      entity?.type === "character"
        ? "character"
        : entity?.type === "camera"
          ? "camera"
          : "object";
    const nextClip = createAnimationClip(
      name,
      animation.tracks,
      editor.selection.selected,
      targetType
    );
    if (!nextClip) return;
    onUpdateAnimation(
      { ...animation, clips: [...animation.clips, nextClip] },
      "Save animation clip"
    );
    setSelectedClipId(nextClip.id);
  };

  const applyClip = () => {
    if (!clip || !selectedTargetId) return;
    commitTracks(
      applyAnimationClip(
        animation.tracks,
        clip,
        selectedTargetId,
        animation.currentFrame
      ),
      "Apply animation clip",
      EMPTY_KEYFRAME_SELECTION
    );
  };

  const addNlaClip = () => {
    if (!clip || !selectedTargetId) return;
    onUpdateAnimation(
      {
        ...animation,
        nlaTracks: addClipToNla(
          animation.nlaTracks,
          clip,
          selectedTargetId,
          animation.currentFrame
        )
      },
      "Add NLA clip"
    );
    setEditor((current) => ({ ...current, view: "nla" }));
  };

  const goRelativeKey = (direction: -1 | 1) => {
    const candidates = keyframeFrames.filter((frame) =>
      direction < 0 ? frame < animation.currentFrame : frame > animation.currentFrame
    );
    const next = direction < 0 ? candidates.at(-1) : candidates[0];
    onSetFrame(next ?? (direction < 0 ? 0 : animation.durationFrames));
  };

  return (
    <footer className="timeline-panel">
      <div className="timeline-controls">
        <div className="timeline-view-tabs" aria-label="Animation editor view">
          <ViewButton
            active={editor.view === "timeline"}
            label="Timeline"
            icon={<ListTree size={14} />}
            onClick={() => setEditor((current) => ({ ...current, view: "timeline" }))}
          />
          <ViewButton
            active={editor.view === "dopesheet"}
            label="Dopesheet"
            icon={<DiamondPlus size={14} />}
            onClick={() => setEditor((current) => ({ ...current, view: "dopesheet" }))}
          />
          <ViewButton
            active={editor.view === "graph"}
            label="Graph"
            icon={<ChartSpline size={14} />}
            onClick={() => setEditor((current) => ({ ...current, view: "graph" }))}
          />
          <ViewButton
            active={editor.view === "nla"}
            label="NLA"
            icon={<Layers3 size={14} />}
            onClick={() => setEditor((current) => ({ ...current, view: "nla" }))}
          />
        </div>

        <button type="button" onClick={() => onSetFrame(0)} title="Go to start">
          <SkipBack size={15} />
        </button>
        <button type="button" onClick={() => goRelativeKey(-1)} title="Previous keyframe">
          <StepBack size={15} />
        </button>
        <button type="button" className="primary-action" onClick={onTogglePlayback}>
          {animation.isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {animation.isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={() => goRelativeKey(1)} title="Next keyframe">
          <StepForward size={15} />
        </button>
        <button
          type="button"
          onClick={() => onSetFrame(animation.durationFrames)}
          title="Go to end"
        >
          <SkipForward size={15} />
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
        <button type="button" onClick={addMarker}>Add Marker</button>
        <button type="button" disabled={!selectedObjectId} onClick={onAddKeyframe}>
          Add Key
        </button>
      </div>

      <div className="keyframe-command-bar">
        <button
          type="button"
          disabled={editor.selection.selected.length === 0}
          title="Copy selected keyframes"
          onClick={() =>
            setEditor((current) => ({
              ...current,
              clipboard: copyKeyframes(animation.tracks, current.selection.selected)
            }))
          }
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          disabled={editor.clipboard.entries.length === 0}
          title="Paste keyframes at playhead"
          onClick={() => {
            const result = pasteKeyframes(
              animation.tracks,
              editor.clipboard,
              animation.currentFrame
            );
            commitTracks(result.tracks, "Paste keyframes", {
              selected: result.selection,
              anchor: result.selection[0] ?? null
            });
          }}
        >
          <Clipboard size={14} />
        </button>
        <button
          type="button"
          disabled={editor.selection.selected.length === 0}
          title="Duplicate selected keyframes"
          onClick={() => {
            const result = duplicateSelectedKeyframes(
              animation.tracks,
              editor.selection.selected,
              editor.snapInterval,
              animation.durationFrames
            );
            commitTracks(result.tracks, "Duplicate keyframes", {
              selected: result.selection,
              anchor: result.selection[0] ?? null
            });
          }}
        >
          <Scissors size={14} />
        </button>
        <button
          type="button"
          disabled={editor.selection.selected.length === 0}
          title="Delete selected keyframes"
          onClick={() =>
            commitTracks(
              deleteSelectedKeyframes(animation.tracks, editor.selection.selected),
              "Delete keyframes",
              EMPTY_KEYFRAME_SELECTION
            )
          }
        >
          <Trash2 size={14} />
        </button>
        <button type="button" disabled={!editor.selection.selected.length} onClick={() => moveSelection(editor.selection.selected, -editor.snapInterval)}>
          -{editor.snapInterval}f
        </button>
        <button type="button" disabled={!editor.selection.selected.length} onClick={() => moveSelection(editor.selection.selected, editor.snapInterval)}>
          +{editor.snapInterval}f
        </button>
        <button
          type="button"
          disabled={!editor.selection.selected.length}
          onClick={() =>
            commitTracks(
              scaleSelectedKeyframeTiming(
                animation.tracks,
                editor.selection.selected,
                0.5,
                animation.currentFrame,
                animation.durationFrames
              ),
              "Compress keyframe timing"
            )
          }
        >
          0.5x
        </button>
        <button
          type="button"
          disabled={!editor.selection.selected.length}
          onClick={() =>
            commitTracks(
              scaleSelectedKeyframeTiming(
                animation.tracks,
                editor.selection.selected,
                2,
                animation.currentFrame,
                animation.durationFrames
              ),
              "Expand keyframe timing"
            )
          }
        >
          2x
        </button>
        <label className="checkbox-label compact-control">
          <input
            type="checkbox"
            checked={editor.snapEnabled}
            onChange={(event) =>
              setEditor((current) => ({ ...current, snapEnabled: event.target.checked }))
            }
          />
          Snap
        </label>
        <label className="compact-control">
          Step
          <input
            type="number"
            min={1}
            max={120}
            value={editor.snapInterval}
            onChange={(event) =>
              setEditor((current) => ({
                ...current,
                snapInterval: Math.max(1, Math.round(Number(event.target.value) || 1))
              }))
            }
          />
        </label>
        <select
          aria-label="Selected keyframe interpolation"
          disabled={!editor.selection.selected.length}
          defaultValue="linear"
          onChange={(event) =>
            commitTracks(
              setSelectedInterpolation(
                animation.tracks,
                editor.selection.selected,
                event.target.value as KeyframeInterpolation
              ),
              "Set keyframe interpolation"
            )
          }
        >
          <option value="constant">Constant</option>
          <option value="linear">Linear</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="ease-in-out">Ease In Out</option>
          <option value="bezier">Bezier</option>
        </select>
        <button type="button" disabled={!editor.selection.selected.length} onClick={saveClip}>
          Save Clip
        </button>
        <select
          aria-label="Reusable animation clip"
          value={selectedClipId}
          onChange={(event) => setSelectedClipId(event.target.value)}
        >
          <option value="">Animation Clips</option>
          {animation.clips.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </select>
        <button type="button" disabled={!clipCompatible} onClick={applyClip}>
          Apply Clip
        </button>
        <button type="button" disabled={!clipCompatible} onClick={addNlaClip}>
          Add To NLA
        </button>
        <span className="timeline-summary">
          {editor.selection.selected.length} selected / {animation.markers.length} markers / {animation.clips.length} clips
        </span>
      </div>

      <div className="animation-editor-content">
        {editor.view === "timeline" && (
          <TimelineView
            project={project}
            selectedTracks={selectedTracks}
            selectedEffectId={selectedEffectId}
            onSetFrame={onSetFrame}
            onSelectEffect={onSelectEffect}
          />
        )}
        {editor.view === "dopesheet" && (
          <Dopesheet
            project={project}
            selection={editor.selection}
            onSelectionChange={(selection) =>
              setEditor((current) => ({ ...current, selection }))
            }
            onSetFrame={onSetFrame}
            onMoveKeyframes={moveSelection}
          />
        )}
        {editor.view === "graph" && (
          <GraphEditor
            tracks={animation.tracks}
            selection={editor.selection.selected}
            durationFrames={animation.durationFrames}
            onSetInterpolation={(interpolation) =>
              commitTracks(
                setSelectedInterpolation(
                  animation.tracks,
                  editor.selection.selected,
                  interpolation
                ),
                "Set graph interpolation"
              )
            }
          />
        )}
        {editor.view === "nla" && (
          <NlaView
            project={project}
            onSetFrame={onSetFrame}
            onToggleMute={(instanceId, muted) =>
              onUpdateAnimation(
                {
                  ...animation,
                  nlaTracks: updateNlaClip(animation.nlaTracks, instanceId, { muted })
                },
                "Toggle NLA clip"
              )
            }
          />
        )}
      </div>
    </footer>
  );
}

function ViewButton({
  active,
  label,
  icon,
  onClick
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? "selected" : ""} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function TimelineView({
  project,
  selectedTracks,
  selectedEffectId,
  onSetFrame,
  onSelectEffect
}: {
  project: MineMotionProject;
  selectedTracks: MineMotionProject["animation"]["tracks"];
  selectedEffectId: string | null;
  onSetFrame: (frame: number) => void;
  onSelectEffect: (effectId: string) => void;
}) {
  const { animation } = project;
  const duration = Math.max(1, animation.durationFrames);
  const markerFrames = new Set(
    selectedTracks.flatMap((track) => track.keyframes.map((keyframe) => keyframe.frame))
  );
  const ticks = Array.from({ length: 21 }, (_, index) =>
    Math.round((duration / 20) * index)
  );
  return (
    <div className="timeline-track professional-timeline">
      <input
        aria-label="Timeline scrubber"
        type="range"
        min={0}
        max={duration}
        value={animation.currentFrame}
        onChange={(event) => onSetFrame(Number(event.target.value))}
      />
      <div className="timeline-ruler timeline-ruler-21">
        {ticks.map((tick) => <span key={tick}>{tick}</span>)}
      </div>
      <div className="keyframe-lane">
        {Array.from(markerFrames).map((frame) => (
          <button
            key={frame}
            type="button"
            className="keyframe-marker"
            style={{ left: `${(frame / duration) * 100}%` }}
            title={`Frame ${frame}`}
            onClick={() => onSetFrame(frame)}
          />
        ))}
        {animation.markers.map((marker) => (
          <button
            key={marker.id}
            type="button"
            className="timeline-named-marker"
            style={{ left: `${(marker.frame / duration) * 100}%`, color: marker.color }}
            title={`${marker.name} @ ${marker.frame}`}
            onClick={() => onSetFrame(marker.frame)}
          >
            {marker.name}
          </button>
        ))}
      </div>
      {animation.timelineTracks
        .filter((track) => track.items.length > 0 || ["rig", "effect", "audio", "sky"].includes(track.type))
        .map((track) => (
          <TimelineBlockLane
            key={track.id}
            label={track.name}
            durationFrames={duration}
            items={track.items}
            selectedEffectId={selectedEffectId}
            onSetFrame={onSetFrame}
            onSelectEffect={onSelectEffect}
          />
        ))}
    </div>
  );
}

function NlaView({
  project,
  onSetFrame,
  onToggleMute
}: {
  project: MineMotionProject;
  onSetFrame: (frame: number) => void;
  onToggleMute: (instanceId: string, muted: boolean) => void;
}) {
  if (project.animation.nlaTracks.length === 0) {
    return <p className="timeline-empty">Save a clip, select it, then add it to NLA.</p>;
  }
  const duration = Math.max(1, project.animation.durationFrames);
  return (
    <div className="nla-editor">
      {project.animation.nlaTracks.map((track) => (
        <div key={track.id} className="nla-row">
          <span>{findObject(project, track.targetId)?.entity.name ?? track.name}</span>
          <div>
            {track.clips.map((instance) => {
              const source = project.animation.clips.find((clip) => clip.id === instance.clipId);
              return (
                <button
                  key={instance.id}
                  type="button"
                  className={instance.muted ? "nla-clip muted" : "nla-clip"}
                  style={{
                    left: `${(instance.startFrame / duration) * 100}%`,
                    width: `${Math.max(2, (instance.durationFrames / duration) * 100)}%`
                  }}
                  title={`${source?.name ?? "Missing clip"} @ ${instance.startFrame}`}
                  onClick={() => onSetFrame(instance.startFrame)}
                  onDoubleClick={() => onToggleMute(instance.id, !instance.muted)}
                >
                  {source?.name ?? "Missing"}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
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
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`timeline-block ${item.effectId === selectedEffectId ? "selected" : ""} ${item.type}`}
            style={{
              left: `${(item.startFrame / durationFrames) * 100}%`,
              width: `${Math.max(1, (item.durationFrames / durationFrames) * 100)}%`
            }}
            title={`${item.label} @ ${item.startFrame}`}
            onClick={() => {
              onSetFrame(item.startFrame);
              if (item.effectId) onSelectEffect(item.effectId);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
