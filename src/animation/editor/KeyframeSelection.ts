import type { AnimationTrack } from "../../project/ProjectFile";
import {
  getKeyframeId,
  keyframeRefKey,
  type KeyframeRef
} from "./KeyframeModel";

export interface KeyframeSelectionState {
  selected: KeyframeRef[];
  anchor: KeyframeRef | null;
}

export const EMPTY_KEYFRAME_SELECTION: KeyframeSelectionState = {
  selected: [],
  anchor: null
};

export function selectOnly(ref: KeyframeRef): KeyframeSelectionState {
  return { selected: [ref], anchor: ref };
}

export function toggleKeyframeSelection(
  state: KeyframeSelectionState,
  ref: KeyframeRef
): KeyframeSelectionState {
  const key = keyframeRefKey(ref);
  const exists = state.selected.some((candidate) => keyframeRefKey(candidate) === key);
  return {
    selected: exists
      ? state.selected.filter((candidate) => keyframeRefKey(candidate) !== key)
      : [...state.selected, ref],
    anchor: ref
  };
}

export function selectFrameRange(
  state: KeyframeSelectionState,
  tracks: AnimationTrack[],
  ref: KeyframeRef
): KeyframeSelectionState {
  if (!state.anchor || state.anchor.trackId !== ref.trackId) return selectOnly(ref);
  const track = tracks.find((candidate) => candidate.id === ref.trackId);
  if (!track) return selectOnly(ref);
  const anchorFrame = frameForRef(track, state.anchor);
  const targetFrame = frameForRef(track, ref);
  if (anchorFrame === null || targetFrame === null) return selectOnly(ref);
  const min = Math.min(anchorFrame, targetFrame);
  const max = Math.max(anchorFrame, targetFrame);
  return {
    selected: track.keyframes.flatMap((keyframe, index) =>
      keyframe.frame >= min && keyframe.frame <= max
        ? [{ trackId: track.id, keyframeId: getKeyframeId(track, keyframe, index) }]
        : []
    ),
    anchor: state.anchor
  };
}

export function isKeyframeSelected(
  state: KeyframeSelectionState,
  ref: KeyframeRef
): boolean {
  const key = keyframeRefKey(ref);
  return state.selected.some((candidate) => keyframeRefKey(candidate) === key);
}

function frameForRef(track: AnimationTrack, ref: KeyframeRef): number | null {
  const index = track.keyframes.findIndex(
    (keyframe, keyframeIndex) =>
      getKeyframeId(track, keyframe, keyframeIndex) === ref.keyframeId
  );
  return index >= 0 ? track.keyframes[index].frame : null;
}
