import { useEffect, useMemo, useRef, useState } from "react";
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
import { createId, findObject } from "../../project/ProjectStore";
import {
  copyEffectTimelineBlock,
  type EffectTimelineClipboardV1,
  type EffectTimelineCommand
} from "../../effects/EffectTimelineController";
import {
  getTimelineFrameAtPosition,
  getTimelineMoveStartFrame
} from "../../effects/EffectTimelineTrack";
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
import { useLocalization } from "../../localization/LocalizationContext";

const EFFECT_TIMELINE_DRAG_TYPE = "application/x-minemotion-effect-timeline";

interface EffectTimelineDragPayload {
  mode: "move" | "trim-start" | "trim-end";
  effectId: string;
  durationFrames: number;
  grabOffsetFrames: number;
}

function setEffectTimelineDragData(
  event: React.DragEvent<HTMLElement>,
  payload: EffectTimelineDragPayload
) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(EFFECT_TIMELINE_DRAG_TYPE, JSON.stringify(payload));
}

interface TimelinePanelProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  selectedEffectId: string | null;
  onSetFrame: (frame: number) => void;
  onSetFps: (fps: number) => void;
  onTogglePlayback: () => void;
  onAddKeyframe: () => void;
  onSelectEffect: (effectId: string) => void;
  onEditEffectTimeline: (command: EffectTimelineCommand) => void;
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
  onEditEffectTimeline,
  onUpdateAnimation
}: TimelinePanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const { animation } = project;
  const [editor, setEditor] = useState(createAnimationEditorState);
  const [selectedClipId, setSelectedClipId] = useState("");
  const [effectClipboard, setEffectClipboard] =
    useState<EffectTimelineClipboardV1 | null>(null);
  const projectIdentity = project.metadata.createdAt;
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
  const selectedEffectIndex = project.effects.instances.findIndex(
    (effect) => effect.id === selectedEffectId
  );
  const selectedEffect =
    selectedEffectIndex >= 0
      ? project.effects.instances[selectedEffectIndex]
      : null;
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

  useEffect(() => {
    setEffectClipboard(null);
  }, [projectIdentity]);

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
    commitTracks(tracks, t("history.moveKeys"), { selected: refs, anchor: refs[0] ?? null });
  };

  const addMarker = () => {
    const name = window.prompt(t("timeline.markerPrompt"), t("timeline.markerDefault", { count: animation.markers.length + 1 }));
    if (!name) return;
    onUpdateAnimation(
      {
        ...animation,
        markers: upsertMarker(
          animation.markers,
          createTimelineMarker(name, animation.currentFrame)
        )
      },
      t("history.addMarker")
    );
  };

  const saveClip = () => {
    const name = window.prompt(t("timeline.clipPrompt"), t("timeline.clipDefault"));
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
      t("history.saveClip")
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
      t("history.applyClip"),
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
      t("history.addNla")
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

  const copySelectedEffect = () => {
    if (!selectedEffect) return;
    const result = copyEffectTimelineBlock(project, selectedEffect.id);
    if (result.ok) setEffectClipboard(result.value);
  };

  return (
    <footer className="timeline-panel">
      <div className="timeline-controls">
        <div className="timeline-view-tabs" aria-label={t("timeline.editorAria")}>
          <ViewButton
            active={editor.view === "timeline"}
            label={t("timeline.timeline")}
            icon={<ListTree size={14} />}
            onClick={() => setEditor((current) => ({ ...current, view: "timeline" }))}
          />
          <ViewButton
            active={editor.view === "dopesheet"}
            label={t("timeline.dopesheet")}
            icon={<DiamondPlus size={14} />}
            onClick={() => setEditor((current) => ({ ...current, view: "dopesheet" }))}
          />
          <ViewButton
            active={editor.view === "graph"}
            label={t("timeline.graph")}
            icon={<ChartSpline size={14} />}
            onClick={() => setEditor((current) => ({ ...current, view: "graph" }))}
          />
          <ViewButton
            active={editor.view === "nla"}
            label={t("timeline.nla")}
            icon={<Layers3 size={14} />}
            onClick={() => setEditor((current) => ({ ...current, view: "nla" }))}
          />
        </div>

        <button type="button" onClick={() => onSetFrame(0)} title={t("timeline.goStart")}>
          <SkipBack size={15} />
        </button>
        <button type="button" onClick={() => goRelativeKey(-1)} title={t("timeline.previousKey")}>
          <StepBack size={15} />
        </button>
        <button type="button" className="primary-action" onClick={onTogglePlayback}>
          {animation.isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {t(animation.isPlaying ? "topbar.pause" : "topbar.play")}
        </button>
        <button type="button" onClick={() => goRelativeKey(1)} title={t("timeline.nextKey")}>
          <StepForward size={15} />
        </button>
        <button
          type="button"
          onClick={() => onSetFrame(animation.durationFrames)}
          title={t("timeline.goEnd")}
        >
          <SkipForward size={15} />
        </button>
        <label>
          {t("timeline.frame")}
          <input
            type="number"
            min={0}
            max={animation.durationFrames}
            value={animation.currentFrame}
            onChange={(event) => onSetFrame(Number(event.target.value))}
          />
        </label>
        <label>
          {t("timeline.fps")}
          <input
            type="number"
            min={1}
            max={120}
            value={animation.fps}
            onChange={(event) => onSetFps(Number(event.target.value))}
          />
        </label>
        <button type="button" onClick={addMarker}>{t("timeline.addMarker")}</button>
        <button type="button" disabled={!selectedObjectId} onClick={onAddKeyframe}>
          {t("timeline.addKey")}
        </button>
      </div>

      <div className="keyframe-command-bar">
        <button
          type="button"
          disabled={editor.selection.selected.length === 0}
          title={t("timeline.copyKeys")}
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
          title={t("timeline.pasteKeys")}
          onClick={() => {
            const result = pasteKeyframes(
              animation.tracks,
              editor.clipboard,
              animation.currentFrame
            );
            commitTracks(result.tracks, t("history.pasteKeys"), {
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
          title={t("timeline.duplicateKeys")}
          onClick={() => {
            const result = duplicateSelectedKeyframes(
              animation.tracks,
              editor.selection.selected,
              editor.snapInterval,
              animation.durationFrames
            );
            commitTracks(result.tracks, t("history.duplicateKeys"), {
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
          title={t("timeline.deleteKeys")}
          onClick={() =>
            commitTracks(
              deleteSelectedKeyframes(animation.tracks, editor.selection.selected),
              t("history.deleteKeys"),
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
              t("history.compressKeys")
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
              t("history.expandKeys")
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
          {t("timeline.snap")}
        </label>
        <label className="compact-control">
          {t("timeline.step")}
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
          aria-label={t("timeline.interpolationAria")}
          disabled={!editor.selection.selected.length}
          defaultValue="linear"
          onChange={(event) =>
            commitTracks(
              setSelectedInterpolation(
                animation.tracks,
                editor.selection.selected,
                event.target.value as KeyframeInterpolation
              ),
              t("history.setInterpolation")
            )
          }
        >
          <option value="constant">{t("timeline.interpolation.constant")}</option>
          <option value="linear">{t("timeline.interpolation.linear")}</option>
          <option value="ease-in">{t("timeline.interpolation.easeIn")}</option>
          <option value="ease-out">{t("timeline.interpolation.easeOut")}</option>
          <option value="ease-in-out">{t("timeline.interpolation.easeInOut")}</option>
          <option value="bezier">{t("timeline.interpolation.bezier")}</option>
        </select>
        <button type="button" disabled={!editor.selection.selected.length} onClick={saveClip}>
          {t("timeline.saveClip")}
        </button>
        <select
          aria-label={t("timeline.clipAria")}
          value={selectedClipId}
          onChange={(event) => setSelectedClipId(event.target.value)}
        >
          <option value="">{t("timeline.clips")}</option>
          {animation.clips.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </select>
        <button type="button" disabled={!clipCompatible} onClick={applyClip}>
          {t("timeline.applyClip")}
        </button>
        <button type="button" disabled={!clipCompatible} onClick={addNlaClip}>
          {t("timeline.addNla")}
        </button>
        <span className="effect-command-label">
          {t("timeline.effectSelected", { name: selectedEffect?.name ?? t("common.none") })}
        </span>
        <button
          type="button"
          disabled={!selectedEffect || selectedEffect.startFrame < editor.snapInterval}
          title={t("timeline.moveEffectEarlier")}
          onClick={() =>
            selectedEffect &&
            onEditEffectTimeline({
              type: "move",
              effectId: selectedEffect.id,
              startFrame: selectedEffect.startFrame - editor.snapInterval
            })
          }
        >
          FX -{editor.snapInterval}f
        </button>
        <button
          type="button"
          disabled={
            !selectedEffect ||
            selectedEffect.startFrame +
              editor.snapInterval +
              selectedEffect.durationFrames >
              animation.durationFrames
          }
          title={t("timeline.moveEffectLater")}
          onClick={() =>
            selectedEffect &&
            onEditEffectTimeline({
              type: "move",
              effectId: selectedEffect.id,
              startFrame: selectedEffect.startFrame + editor.snapInterval
            })
          }
        >
          FX +{editor.snapInterval}f
        </button>
        <button
          type="button"
          disabled={
            !selectedEffect ||
            selectedEffect.startFrame === animation.currentFrame ||
            animation.currentFrame + selectedEffect.durationFrames >
              animation.durationFrames
          }
          title={t("timeline.moveEffectPlayhead")}
          onClick={() =>
            selectedEffect &&
            onEditEffectTimeline({
              type: "move",
              effectId: selectedEffect.id,
              startFrame: animation.currentFrame
            })
          }
        >
          {t("timeline.moveAt")}
        </button>
        <button
          type="button"
          disabled={
            !selectedEffect ||
            animation.currentFrame >=
              selectedEffect.startFrame + selectedEffect.durationFrames ||
            animation.currentFrame === selectedEffect.startFrame
          }
          title={t("timeline.trimStart")}
          onClick={() =>
            selectedEffect &&
            onEditEffectTimeline({
              type: "trim-start",
              effectId: selectedEffect.id,
              startFrame: animation.currentFrame
            })
          }
        >
          {t("timeline.trimLeft")}
        </button>
        <button
          type="button"
          disabled={
            !selectedEffect ||
            animation.currentFrame <= selectedEffect.startFrame ||
            animation.currentFrame ===
              selectedEffect.startFrame + selectedEffect.durationFrames
          }
          title={t("timeline.trimEnd")}
          onClick={() =>
            selectedEffect &&
            onEditEffectTimeline({
              type: "trim-end",
              effectId: selectedEffect.id,
              endFrame: animation.currentFrame
            })
          }
        >
          {t("timeline.trimRight")}
        </button>
        <button
          type="button"
          disabled={
            !selectedEffect ||
            selectedEffect.startFrame + 1 + selectedEffect.durationFrames >
              animation.durationFrames
          }
          title={t("timeline.duplicateEffect")}
          onClick={() =>
            selectedEffect &&
            onEditEffectTimeline({
              type: "duplicate",
              effectId: selectedEffect.id,
              newEffectId: createId("effect"),
              startFrame: selectedEffect.startFrame + 1
            })
          }
        >
          <Scissors size={14} /> FX
        </button>
        <button
          type="button"
          disabled={!selectedEffect}
          title={t("timeline.copyEffect")}
          onClick={copySelectedEffect}
        >
          <Copy size={14} /> FX
        </button>
        <button
          type="button"
          disabled={
            !effectClipboard ||
            animation.currentFrame +
              (effectClipboard?.effect.durationFrames ?? 0) >
              animation.durationFrames
          }
          title={t("timeline.pasteEffect")}
          onClick={() =>
            effectClipboard &&
            onEditEffectTimeline({
              type: "paste",
              clipboard: effectClipboard,
              newEffectId: createId("effect"),
              startFrame: animation.currentFrame
            })
          }
        >
          <Clipboard size={14} /> FX
        </button>
        <button
          type="button"
          disabled={!selectedEffect}
          title={t(selectedEffect?.enabled ? "timeline.disableEffect" : "timeline.enableEffect")}
          onClick={() =>
            selectedEffect &&
            onEditEffectTimeline({
              type: "set-enabled",
              effectId: selectedEffect.id,
              enabled: !selectedEffect.enabled
            })
          }
        >
          {t(selectedEffect?.enabled ? "timeline.disableFx" : "timeline.enableFx")}
        </button>
        <button
          type="button"
          disabled={!selectedEffect || selectedEffectIndex <= 0}
          title={t("timeline.priorityEarlier")}
          onClick={() =>
            selectedEffect &&
            onEditEffectTimeline({
              type: "reorder",
              effectId: selectedEffect.id,
              toIndex: selectedEffectIndex - 1
            })
          }
        >
          {t("timeline.priorityMinus")}
        </button>
        <button
          type="button"
          disabled={
            !selectedEffect ||
            selectedEffectIndex >= project.effects.instances.length - 1
          }
          title={t("timeline.priorityLater")}
          onClick={() =>
            selectedEffect &&
            onEditEffectTimeline({
              type: "reorder",
              effectId: selectedEffect.id,
              toIndex: selectedEffectIndex + 1
            })
          }
        >
          {t("timeline.priorityPlus")}
        </button>
        {effectClipboard && (
          <span className="effect-clipboard-note">
            {t("timeline.copied", { name: effectClipboard.effect.name })}
          </span>
        )}
        <span className="timeline-summary">
          {t("timeline.summary", {
            selected: editor.selection.selected.length,
            markers: animation.markers.length,
            clips: animation.clips.length
          })}
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
            onEditEffectTimeline={onEditEffectTimeline}
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
                t("history.setGraphInterpolation")
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
                t("history.toggleNla")
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
  onSelectEffect,
  onEditEffectTimeline
}: {
  project: MineMotionProject;
  selectedTracks: MineMotionProject["animation"]["tracks"];
  selectedEffectId: string | null;
  onSetFrame: (frame: number) => void;
  onSelectEffect: (effectId: string) => void;
  onEditEffectTimeline: (command: EffectTimelineCommand) => void;
}) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const { animation } = project;
  const duration = Math.max(1, animation.durationFrames);
  const markerFrames = new Set(
    selectedTracks.flatMap((track) => track.keyframes.map((keyframe) => keyframe.frame))
  );
  const ticks = Array.from({ length: 21 }, (_, index) =>
    Math.round((duration / 20) * index)
  );
  const disabledEffectIds = new Set(
    project.effects.instances
      .filter((effect) => !effect.enabled)
      .map((effect) => effect.id)
  );
  return (
    <div className="timeline-track professional-timeline">
      <input
        aria-label={t("timeline.scrubberAria")}
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
            title={t("timeline.frameTitle", { frame })}
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
            disabledEffectIds={disabledEffectIds}
            acceptsEffectDrop={track.type === "effect"}
            onSetFrame={onSetFrame}
            onSelectEffect={onSelectEffect}
            onEditEffectTimeline={onEditEffectTimeline}
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
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  if (project.animation.nlaTracks.length === 0) {
    return <p className="timeline-empty">{t("timeline.nlaEmpty")}</p>;
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
                  title={`${source?.name ?? t("timeline.missingClip")} @ ${instance.startFrame}`}
                  onClick={() => onSetFrame(instance.startFrame)}
                  onDoubleClick={() => onToggleMute(instance.id, !instance.muted)}
                >
                  {source?.name ?? t("timeline.missing")}
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
  disabledEffectIds,
  acceptsEffectDrop,
  onSetFrame,
  onSelectEffect,
  onEditEffectTimeline
}: {
  label: string;
  durationFrames: number;
  items: TimelineItem[];
  selectedEffectId: string | null;
  disabledEffectIds: ReadonlySet<string>;
  acceptsEffectDrop: boolean;
  onSetFrame: (frame: number) => void;
  onSelectEffect: (effectId: string) => void;
  onEditEffectTimeline: (command: EffectTimelineCommand) => void;
}) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const laneRef = useRef<HTMLDivElement>(null);
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!acceptsEffectDrop) return;
    const raw = event.dataTransfer.getData(EFFECT_TIMELINE_DRAG_TYPE);
    if (!raw) return;
    event.preventDefault();
    try {
      const payload = JSON.parse(raw) as EffectTimelineDragPayload;
      if (
        !payload ||
        typeof payload.effectId !== "string" ||
        !["move", "trim-start", "trim-end"].includes(payload.mode)
      ) {
        return;
      }
      const bounds = event.currentTarget.getBoundingClientRect();
      const frame = getTimelineFrameAtPosition(
        event.clientX,
        bounds.left,
        bounds.width,
        durationFrames
      );
      if (payload.mode === "move") {
        onEditEffectTimeline({
          type: "move",
          effectId: payload.effectId,
          startFrame: getTimelineMoveStartFrame(
            frame,
            payload.grabOffsetFrames,
            payload.durationFrames,
            durationFrames
          )
        });
      } else if (payload.mode === "trim-start") {
        onEditEffectTimeline({
          type: "trim-start",
          effectId: payload.effectId,
          startFrame: frame
        });
      } else {
        onEditEffectTimeline({
          type: "trim-end",
          effectId: payload.effectId,
          endFrame: frame
        });
      }
    } catch {
      // Ignore foreign or malformed drag payloads.
    }
  };

  return (
    <div className="timeline-block-lane" aria-label={t("timeline.laneAria", { label })}>
      <span>{label}</span>
      <div
        ref={laneRef}
        onDragOver={(event) => {
          if (
            acceptsEffectDrop &&
            event.dataTransfer.types.includes(EFFECT_TIMELINE_DRAG_TYPE)
          ) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={acceptsEffectDrop ? handleDrop : undefined}
      >
        {items.map((item) => {
          const effectId = acceptsEffectDrop ? item.effectId : undefined;
          const className = `timeline-block ${effectId === selectedEffectId ? "selected" : ""} ${effectId && disabledEffectIds.has(effectId) ? "disabled-effect" : ""} ${item.type}`;
          const title = `${item.label} @ ${item.startFrame}${effectId && disabledEffectIds.has(effectId) ? ` (${t("timeline.disabledSuffix")})` : ""}`;
          const style = {
            left: `${(item.startFrame / durationFrames) * 100}%`,
            width: `${Math.max(1, (item.durationFrames / durationFrames) * 100)}%`
          };
          const selectItem = () => {
            onSetFrame(item.startFrame);
            if (effectId) onSelectEffect(effectId);
          };

          if (!effectId) {
            return (
              <button
                key={item.id}
                type="button"
                className={className}
                style={style}
                title={title}
                onClick={selectItem}
              >
                {item.label}
              </button>
            );
          }

          const dragPayload = {
            effectId,
            durationFrames: item.durationFrames,
            grabOffsetFrames: 0
          };
          return (
            <div key={item.id} className="timeline-block-shell" style={style}>
              <button
                type="button"
                className={className}
                title={t("timeline.dragMove", { title })}
                draggable
                onDragStart={(event) => {
                  const bounds = laneRef.current?.getBoundingClientRect();
                  if (!bounds) {
                    event.preventDefault();
                    return;
                  }
                  const pointerFrame = getTimelineFrameAtPosition(
                    event.clientX,
                    bounds.left,
                    bounds.width,
                    durationFrames
                  );
                  setEffectTimelineDragData(event, {
                    ...dragPayload,
                    grabOffsetFrames: pointerFrame - item.startFrame,
                    mode: "move"
                  });
                }}
                onClick={selectItem}
              >
                {item.label}
              </button>
              <button
                type="button"
                className="timeline-trim-handle start"
                aria-label={t("timeline.trimItemStart", { name: item.label })}
                title={t("timeline.dragTrimStart")}
                draggable
                onClick={(event) => event.stopPropagation()}
                onDragStart={(event) => {
                  event.stopPropagation();
                  setEffectTimelineDragData(event, {
                    ...dragPayload,
                    mode: "trim-start"
                  });
                }}
              />
              <button
                type="button"
                className="timeline-trim-handle end"
                aria-label={t("timeline.trimItemEnd", { name: item.label })}
                title={t("timeline.dragTrimEnd")}
                draggable
                onClick={(event) => event.stopPropagation()}
                onDragStart={(event) => {
                  event.stopPropagation();
                  setEffectTimelineDragData(event, {
                    ...dragPayload,
                    mode: "trim-end"
                  });
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
