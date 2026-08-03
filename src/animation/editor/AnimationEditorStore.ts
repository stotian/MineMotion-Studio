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
  zoom: number;
  density: "comfortable" | "compact";
  expandedTargets: string[];
}

export function createAnimationEditorState(): AnimationEditorState {
  return {
    view: "timeline",
    selection: EMPTY_KEYFRAME_SELECTION,
    clipboard: { entries: [], durationFrames: 0 },
    snapEnabled: true,
    snapInterval: 1,
    zoom: 1,
    density: "comfortable",
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
    snapInterval: Math.max(1, Math.round(patch.snapInterval ?? state.snapInterval)),
    zoom: Math.min(8, Math.max(0.5, patch.zoom ?? state.zoom)),
    density: patch.density === "compact" ? "compact" : patch.density === "comfortable" ? "comfortable" : state.density
  };
}
