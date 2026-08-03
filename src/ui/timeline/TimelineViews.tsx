import { useRef, type DragEvent, type ReactNode } from "react";
import type {
  MineMotionProject,
  TimelineItem
} from "../../project/ProjectFile";
import { findObject } from "../../project/ProjectStore";
import type { EffectTimelineCommand } from "../../effects/EffectTimelineController";
import {
  getTimelineFrameAtPosition,
  getTimelineMoveStartFrame
} from "../../effects/EffectTimelineTrack";
import { getNlaLayerKind } from "../../animation/layers/AnimationLayerNlaAdapter";
import { useLocalization } from "../../localization/LocalizationContext";
import { ANIMATION_LAYER_TRANSLATION_KEYS } from "./TimelineConstants";
import {
  collectDisabledEffectIds,
  collectKeyframeFrames,
  createTimelineTicks,
  getNlaClipStyle,
  getTimelineItemStyle,
  normalizeTimelineDuration,
  shouldDisplayTimelineTrack
} from "./TimelineViewModel";

const EFFECT_TIMELINE_DRAG_TYPE = "application/x-minemotion-effect-timeline";

interface EffectTimelineDragPayload {
  mode: "move" | "trim-start" | "trim-end";
  effectId: string;
  durationFrames: number;
  grabOffsetFrames: number;
}

function setEffectTimelineDragData(
  event: DragEvent<HTMLElement>,
  payload: EffectTimelineDragPayload
): void {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(EFFECT_TIMELINE_DRAG_TYPE, JSON.stringify(payload));
}

export function TimelineViewButton({
  active,
  label,
  icon,
  onClick
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? "selected" : ""} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

export function TimelineView({
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
  const duration = normalizeTimelineDuration(animation.durationFrames);
  const markerFrames = collectKeyframeFrames(selectedTracks);
  const ticks = createTimelineTicks(duration);
  const disabledEffectIds = collectDisabledEffectIds(project.effects.instances);

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
        {ticks.map((tick, index) => <span key={`${index}-${tick}`}>{tick}</span>)}
      </div>
      <div className="keyframe-lane">
        {markerFrames.map((frame) => (
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
        .filter(shouldDisplayTimelineTrack)
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

export function NlaView({
  project,
  onSetFrame,
  onToggleMute,
  onUpdateLayer
}: {
  project: MineMotionProject;
  onSetFrame: (frame: number) => void;
  onToggleMute: (instanceId: string, muted: boolean) => void;
  onUpdateLayer: (
    layerId: string,
    patch: {
      muted?: boolean;
      weight?: number;
      vfxEffectIds?: string[];
    }
  ) => void;
}) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  if (project.animation.nlaTracks.length === 0) {
    return <p className="timeline-empty">{t("timeline.nlaEmpty")}</p>;
  }
  const duration = normalizeTimelineDuration(project.animation.durationFrames);
  return (
    <div className="nla-editor">
      {project.animation.nlaTracks.map((track) => (
        <div key={track.id} className="nla-row">
          <div className="nla-layer-controls">
            <span>
              {findObject(project, track.targetId)?.entity.name ?? track.name}
              {" · "}
              <strong>
                {t(ANIMATION_LAYER_TRANSLATION_KEYS[getNlaLayerKind(track)])}
              </strong>
            </span>
            <label>
              <input
                type="checkbox"
                checked={track.muted === true}
                onChange={(event) =>
                  onUpdateLayer(track.id, { muted: event.target.checked })
                }
              />
              {t("timeline.layerMuted")}
            </label>
            {getNlaLayerKind(track) !== "vfxSync" && (
              <label>
                {t("timeline.layerWeight")}
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={track.weight ?? 1}
                  onChange={(event) =>
                    onUpdateLayer(track.id, {
                      weight: event.target.valueAsNumber
                    })
                  }
                />
              </label>
            )}
            {getNlaLayerKind(track) === "vfxSync" && (
              <label>
                {t("timeline.layerEffects")}
                <select
                  multiple
                  aria-label={t("timeline.layerEffectsAria")}
                  value={track.vfxEffectIds ?? []}
                  onChange={(event) =>
                    onUpdateLayer(track.id, {
                      vfxEffectIds: [...event.target.selectedOptions].map(
                        (option) => option.value
                      )
                    })
                  }
                >
                  {project.effects.instances.map((effect) => (
                    <option key={effect.id} value={effect.id}>
                      {effect.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="nla-clip-lane">
            {track.clips.map((instance) => {
              const source = project.animation.clips.find(
                (clip) => clip.id === instance.clipId
              );
              return (
                <button
                  key={instance.id}
                  type="button"
                  className={instance.muted ? "nla-clip muted" : "nla-clip"}
                  style={getNlaClipStyle(instance, duration)}
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
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
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
      event.dataTransfer.dropEffect = "none";
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
          const style = getTimelineItemStyle(item, durationFrames);
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
