import type { DragEvent, MouseEvent } from "react";
import type { MineMotionProject } from "../../project/ProjectFile";
import { buildTrackHierarchy } from "./TrackModel";
import {
  getKeyframeId,
  type KeyframeRef
} from "./KeyframeModel";
import {
  isKeyframeSelected,
  selectFrameRange,
  selectOnly,
  toggleKeyframeSelection,
  type KeyframeSelectionState
} from "./KeyframeSelection";
import { useLocalization } from "../../localization/LocalizationContext";

interface DopesheetProps {
  project: MineMotionProject;
  selection: KeyframeSelectionState;
  onSelectionChange: (selection: KeyframeSelectionState) => void;
  onSetFrame: (frame: number) => void;
  onMoveKeyframes: (selection: KeyframeRef[], deltaFrames: number) => void;
}

export function Dopesheet({
  project,
  selection,
  onSelectionChange,
  onSetFrame,
  onMoveKeyframes
}: DopesheetProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const groups = buildTrackHierarchy(project);
  const duration = Math.max(1, project.animation.durationFrames);

  if (groups.length === 0) {
    return <p className="timeline-empty">{t("dopesheet.empty")}</p>;
  }

  return (
    <div className="dopesheet" role="grid" aria-label={t("dopesheet.ariaLabel")}>
      {groups.map((group) => (
        <section key={group.targetId} className="dopesheet-group">
          <header>
            <strong>{group.targetName}</strong>
            <span>{group.targetType}</span>
          </header>
          {group.tracks.map((track) => (
            <div key={track.id} className="dopesheet-row" role="row">
              <span title={track.property}>{formatProperty(track.property)}</span>
              <div
                className="dopesheet-lane"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) =>
                  handleDrop(event, duration, selection, onMoveKeyframes)
                }
              >
                <i
                  className="timeline-playhead-line"
                  style={{
                    left: `${(project.animation.currentFrame / duration) * 100}%`
                  }}
                />
                {track.keyframes.map((keyframe, index) => {
                  const ref = {
                    trackId: track.id,
                    keyframeId: getKeyframeId(track, keyframe, index)
                  };
                  const selected = isKeyframeSelected(selection, ref);
                  return (
                    <button
                      key={ref.keyframeId}
                      type="button"
                      draggable
                      className={selected ? "dopesheet-key selected" : "dopesheet-key"}
                      style={{ left: `${(keyframe.frame / duration) * 100}%` }}
                      title={`${track.property} @ ${keyframe.frame} (${keyframe.interpolation ?? "linear"})`}
                      onClick={(event) => {
                        onSelectionChange(
                          updateSelection(event, selection, project, ref)
                        );
                        onSetFrame(keyframe.frame);
                      }}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData(
                          "application/x-minemotion-keyframe",
                          JSON.stringify({ ...ref, frame: keyframe.frame })
                        );
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function updateSelection(
  event: MouseEvent,
  selection: KeyframeSelectionState,
  project: MineMotionProject,
  ref: KeyframeRef
): KeyframeSelectionState {
  if (event.shiftKey) {
    return selectFrameRange(selection, project.animation.tracks, ref);
  }
  if (event.ctrlKey || event.metaKey) {
    return toggleKeyframeSelection(selection, ref);
  }
  return selectOnly(ref);
}

function handleDrop(
  event: DragEvent<HTMLDivElement>,
  duration: number,
  selection: KeyframeSelectionState,
  onMoveKeyframes: (selection: KeyframeRef[], deltaFrames: number) => void
): void {
  const raw = event.dataTransfer.getData("application/x-minemotion-keyframe");
  if (!raw) return;
  const dragged = JSON.parse(raw) as KeyframeRef & { frame: number };
  const rect = event.currentTarget.getBoundingClientRect();
  const targetFrame = Math.max(
    0,
    Math.min(duration, Math.round(((event.clientX - rect.left) / rect.width) * duration))
  );
  const refs = isKeyframeSelected(selection, dragged)
    ? selection.selected
    : [{ trackId: dragged.trackId, keyframeId: dragged.keyframeId }];
  onMoveKeyframes(refs, targetFrame - dragged.frame);
}

function formatProperty(property: string): string {
  return property
    .replace("transform.", "")
    .replace("bone.rotation.", "bone: ");
}
