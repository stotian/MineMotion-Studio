import { useEffect, useMemo, useState } from "react";
import {
  ChartSpline,
  Clipboard,
  Copy,
  DiamondPlus,
  Layers3,
  Clock,
  ListTree,
  Pause,
  Play,
  Scissors,
  Rows3,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
  Trash2,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import type {
  KeyframeInterpolation,
  MineMotionProject,
  ReusableAnimationClip,
  TimelineData
} from "../../project/ProjectFile";
import { createId, findObject } from "../../project/ProjectStore";
import {
  copyEffectTimelineBlock,
  type EffectTimelineClipboardV1,
  type EffectTimelineCommand
} from "../../effects/EffectTimelineController";
import { getSelectedCharacterId } from "../../rigs/RigSelection";
import { createAnimationEditorState, updateAnimationEditorState } from "../../animation/editor/AnimationEditorStore";
import { copyKeyframes, pasteKeyframes } from "../../animation/editor/KeyframeClipboard";
import {
  deleteSelectedKeyframes,
  duplicateSelectedKeyframes,
  loopSelectedKeyframes,
  mirrorSelectedKeyframes,
  moveSelectedKeyframes,
  reduceSelectedKeyframeNoise,
  removeRedundantSelectedKeyframes,
  reverseSelectedKeyframes,
  scaleSelectedKeyframeTiming,
  setSelectedInterpolation,
  smoothSelectedKeyframes,
  snapSelectedKeyframes
} from "../../animation/editor/KeyframeCommands";
import type {
  KeyframeCleanupResult,
  KeyframeTransformResult
} from "../../animation/editor/KeyframeCommands";
import type { KeyframeRef } from "../../animation/editor/KeyframeModel";
import { EMPTY_KEYFRAME_SELECTION } from "../../animation/editor/KeyframeSelection";
import { createTimelineMarker, upsertMarker } from "../../animation/editor/Markers";
import {
  applyAnimationClip,
  createAnimationClip,
  isAnimationClipCompatible
} from "../../animation/editor/ClipSystem";
import {
  addClipToAnimationLayer,
  ensureNlaLayer,
  updateNlaClip,
  updateNlaLayer
} from "../../animation/editor/NlaTracks";
import type { AnimationLayerKind } from "../../animation/layers/AnimationLayer";
import {
  getNlaLayerKind,
  isClipCompatibleWithLayer
} from "../../animation/layers/AnimationLayerNlaAdapter";
import { Dopesheet } from "../../animation/editor/Dopesheet";
import { GraphEditor } from "../../animation/editor/GraphEditor";
import { EditorHeader, EditorMenu } from "../shell/EditorHeader";
import { useLocalization } from "../../localization/LocalizationContext";
import {
  ANIMATION_LAYER_TRANSLATION_KEYS,
  CLIP_LAYER_KINDS
} from "./TimelineConstants";
import {
  NlaView,
  TimelineView,
  TimelineViewButton as ViewButton
} from "./TimelineViews";

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
  const [selectedLayerKind, setSelectedLayerKind] =
    useState<AnimationLayerKind>("base");
  const [cleanupTolerance, setCleanupTolerance] = useState(0.25);
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
  const clipTargetCompatible = Boolean(
    clip &&
    selectedTargetId &&
    isAnimationClipCompatible(clip, selectedTargetType)
  );
  const clipLayerCompatible = Boolean(
    clip &&
    clipTargetCompatible &&
    isClipCompatibleWithLayer(clip, selectedLayerKind)
  );
  const hasSelectedVfxSyncLayer = Boolean(
    selectedTargetId &&
    animation.nlaTracks.some((track) =>
      track.targetId === selectedTargetId &&
      getNlaLayerKind(track) === "vfxSync"
    )
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

  const commitKeyframeResult = (
    result: KeyframeCleanupResult | KeyframeTransformResult,
    label: string
  ) => {
    if (!result.changed) return;
    commitTracks(result.tracks, label, {
      selected: result.selection,
      anchor: result.selection[0] ?? null
    });
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
        nlaTracks: addClipToAnimationLayer(
          animation.nlaTracks,
          clip,
          selectedTargetId,
          animation.currentFrame,
          selectedLayerKind
        )
      },
      t("history.addNla")
    );
    setEditor((current) => ({ ...current, view: "nla" }));
  };

  const addVfxSyncLayer = () => {
    if (!selectedTargetId) return;
    onUpdateAnimation(
      {
        ...animation,
        nlaTracks: ensureNlaLayer(
          animation.nlaTracks,
          selectedTargetId,
          "vfxSync"
        )
      },
      t("history.addVfxSyncLayer")
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
      {/* Blender's timeline header: editor icon then Playback / Keying / View. */}
      <EditorHeader
        icon={Clock}
        label={t("timeline.editorAria")}
        menus={
          <>
            <EditorMenu label={t("timeline.menu.playback")} />
            <EditorMenu label={t("timeline.menu.keying")} />
            <EditorMenu label={t("timeline.menu.view")} />
            <EditorMenu label={t("timeline.menu.marker")} />
          </>
        }
      />
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

        {/* Blender's transport: one compact icon-only cluster, centred. */}
        <div className="timeline-transport" role="group" aria-label={t("timeline.transport")}>
          <button type="button" onClick={() => onSetFrame(0)} title={t("timeline.goStart")}>
            <SkipBack size={14} />
          </button>
          <button type="button" onClick={() => goRelativeKey(-1)} title={t("timeline.previousKey")}>
            <StepBack size={14} />
          </button>
          <button
            type="button"
            className={animation.isPlaying ? "is-active" : undefined}
            onClick={onTogglePlayback}
            title={t(animation.isPlaying ? "topbar.pause" : "topbar.play")}
          >
            {animation.isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button type="button" onClick={() => goRelativeKey(1)} title={t("timeline.nextKey")}>
            <StepForward size={14} />
          </button>
          <button
            type="button"
            onClick={() => onSetFrame(animation.durationFrames)}
            title={t("timeline.goEnd")}
          >
            <SkipForward size={14} />
          </button>
        </div>
        {/* Blender shows the playhead frame, then the Start/End range. */}
        <div className="timeline-frames">
          <label className="timeline-frame-field">
            <span>{t("timeline.frame")}</span>
            <input
              type="number"
              min={0}
              max={animation.durationFrames}
              value={animation.currentFrame}
              onChange={(event) => onSetFrame(Number(event.target.value))}
            />
          </label>
          <label className="timeline-frame-field">
            <span>{t("timeline.rangeEnd")}</span>
            <input
              type="number"
              min={1}
              max={100000}
              value={animation.durationFrames}
              readOnly
            />
          </label>
          <label className="timeline-frame-field">
            <span>{t("timeline.fps")}</span>
            <input
              type="number"
              min={1}
              max={120}
              value={animation.fps}
              onChange={(event) => onSetFps(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="timeline-extra">
        <button type="button" onClick={addMarker}>{t("timeline.addMarker")}</button>
        <button type="button" title={t("timeline.zoomOut")} disabled={editor.zoom <= 0.5}
          onClick={() => setEditor((current) => updateAnimationEditorState(current, { zoom: current.zoom / 1.25 }))}><ZoomOut size={14} /></button>
        <output className="timeline-zoom-label" aria-label={t("timeline.zoom")}>{Math.round(editor.zoom * 100)}%</output>
        <button type="button" title={t("timeline.zoomIn")} disabled={editor.zoom >= 8}
          onClick={() => setEditor((current) => updateAnimationEditorState(current, { zoom: current.zoom * 1.25 }))}><ZoomIn size={14} /></button>
        <button type="button" title={t("timeline.toggleDensity")}
          onClick={() => setEditor((current) => updateAnimationEditorState(current, { density: current.density === "compact" ? "comfortable" : "compact" }))}>
          <Rows3 size={14} /> {t(editor.density === "compact" ? "timeline.densityComfortable" : "timeline.densityCompact")}
        </button>
        <button type="button" disabled={!selectedObjectId} onClick={onAddKeyframe}>
          {t("timeline.addKey")}
        </button>
        </div>
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
        <button
          type="button"
          disabled={!editor.selection.selected.length}
          title={t("timeline.removeRedundantTitle")}
          onClick={() =>
            commitKeyframeResult(
              removeRedundantSelectedKeyframes(
                animation.tracks,
                editor.selection.selected
              ),
              t("history.removeRedundantKeys")
            )
          }
        >
          {t("timeline.removeRedundant")}
        </button>
        <button
          type="button"
          disabled={!editor.selection.selected.length}
          title={t("timeline.smoothKeysTitle")}
          onClick={() => {
            const tracks = smoothSelectedKeyframes(
              animation.tracks,
              editor.selection.selected,
              0.5
            );
            if (tracks !== animation.tracks) {
              commitTracks(tracks, t("history.smoothKeys"));
            }
          }}
        >
          {t("timeline.smoothKeys")}
        </button>
        <button
          type="button"
          disabled={!editor.selection.selected.length}
          title={t("timeline.reduceNoiseTitle")}
          onClick={() =>
            commitKeyframeResult(
              reduceSelectedKeyframeNoise(
                animation.tracks,
                editor.selection.selected,
                cleanupTolerance
              ),
              t("history.reduceKeyNoise")
            )
          }
        >
          {t("timeline.reduceNoise")}
        </button>
        <button
          type="button"
          disabled={!editor.selection.selected.length}
          title={t("timeline.loopKeysTitle")}
          onClick={() =>
            commitKeyframeResult(
              loopSelectedKeyframes(
                animation.tracks,
                editor.selection.selected,
                1,
                animation.durationFrames
              ),
              t("history.loopKeys")
            )
          }
        >
          {t("timeline.loopKeys")}
        </button>
        <button
          type="button"
          disabled={!editor.selection.selected.length}
          title={t("timeline.reverseKeysTitle")}
          onClick={() =>
            commitKeyframeResult(
              reverseSelectedKeyframes(
                animation.tracks,
                editor.selection.selected
              ),
              t("history.reverseKeys")
            )
          }
        >
          {t("timeline.reverseKeys")}
        </button>
        <button
          type="button"
          disabled={!editor.selection.selected.length}
          title={t("timeline.mirrorKeysTitle")}
          onClick={() =>
            commitKeyframeResult(
              mirrorSelectedKeyframes(
                animation.tracks,
                editor.selection.selected
              ),
              t("history.mirrorKeys")
            )
          }
        >
          {t("timeline.mirrorKeys")}
        </button>
        <label className="compact-control">
          {t("timeline.noiseTolerance")}
          <input
            type="number"
            min={0}
            max={180}
            step={0.01}
            value={cleanupTolerance}
            onChange={(event) =>
              setCleanupTolerance(Math.min(
                180,
                Math.max(0, event.target.valueAsNumber || 0)
              ))
            }
          />
        </label>
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
        <button type="button" disabled={!clipTargetCompatible} onClick={applyClip}>
          {t("timeline.applyClip")}
        </button>
        <select
          aria-label={t("timeline.layerAria")}
          value={selectedLayerKind}
          onChange={(event) =>
            setSelectedLayerKind(event.target.value as AnimationLayerKind)
          }
        >
          {CLIP_LAYER_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {t(ANIMATION_LAYER_TRANSLATION_KEYS[kind])}
            </option>
          ))}
        </select>
        <button type="button" disabled={!clipLayerCompatible} onClick={addNlaClip}>
          {t("timeline.addNla")}
        </button>
        <button
          type="button"
          disabled={!selectedTargetId || hasSelectedVfxSyncLayer}
          onClick={addVfxSyncLayer}
        >
          {t("timeline.addVfxSyncLayer")}
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

      <div className={`animation-editor-content timeline-density-${editor.density}`}>
        <div className="timeline-zoom-surface" style={{ width: `${editor.zoom * 100}%` }}>
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
            onUpdateLayer={(layerId, patch) =>
              onUpdateAnimation(
                {
                  ...animation,
                  nlaTracks: updateNlaLayer(
                    animation.nlaTracks,
                    layerId,
                    patch
                  )
                },
                t("history.updateNlaLayer")
              )
            }
          />
        )}
        </div>
      </div>
    </footer>
  );
}
