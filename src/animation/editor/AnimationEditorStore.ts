import type { KeyframeClipboardData } from "./KeyframeClipboard";
import type { KeyframeSelectionState } from "./KeyframeSelection";
import { EMPTY_KEYFRAME_SELECTION } from "./KeyframeSelection";

export type AnimationEditorView = "timeline" | "dopesheet" | "graph" | "nla";

export interface AnimationEditorState {
  view: AnimationEditorView;
  selection: KeyframeSelectionState;
  clipboard: KeyframeClipboardData;
  snapEnabled: boolean;
  snapInterval: number;
  expandedTargets: string[];
}

export function createAnimationEditorState(): AnimationEditorState {
  return {
    view: "timeline",
    selection: EMPTY_KEYFRAME_SELECTION,
    clipboard: { entries: [], durationFrames: 0 },
    snapEnabled: true,
    snapInterval: 1,
    expandedTargets: []
  };
}

export function updateAnimationEditorState(
  state: AnimationEditorState,
  patch: Partial<AnimationEditorState>
): AnimationEditorState {
  return {
    ...state,
    ...patch,
    snapInterval: Math.max(1, Math.round(patch.snapInterval ?? state.snapInterval))
  };
}
