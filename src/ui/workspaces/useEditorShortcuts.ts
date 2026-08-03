import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { EffectTimelineCommand } from "../../effects/EffectTimelineController";
import type { MineMotionProject } from "../../project/ProjectFile";
import { createId } from "../../project/ProjectStore";

interface EditorShortcutActions {
  projectRef: MutableRefObject<MineMotionProject>;
  selectedEffectId: string | null;
  openCommandPalette: () => void;
  saveProject: () => void;
  undo: () => void;
  redo: () => void;
  duplicateObject: () => void;
  deleteObject: () => void;
  deleteEffect: (effectId: string) => void;
  editEffect: (command: EffectTimelineCommand) => void;
  togglePlayback: () => void;
}

export function useEditorShortcuts(actions: EditorShortcutActions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const target = event.target as HTMLElement | null;
      const isTextInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" || target?.isContentEditable === true;
      const primaryModifier = event.ctrlKey || event.metaKey;

      if (primaryModifier && key === "p") {
        event.preventDefault();
        actions.openCommandPalette();
      } else if (primaryModifier && key === "s") {
        event.preventDefault();
        actions.saveProject();
      } else if (!isTextInput && primaryModifier && key === "z" && !event.shiftKey) {
        event.preventDefault();
        actions.undo();
      } else if (!isTextInput && primaryModifier && (key === "y" || (event.shiftKey && key === "z"))) {
        event.preventDefault();
        actions.redo();
      } else if (!isTextInput && primaryModifier && key === "d") {
        event.preventDefault();
        const selectedEffect = actions.selectedEffectId
          ? actions.projectRef.current.effects.instances.find((effect) => effect.id === actions.selectedEffectId)
          : null;
        if (selectedEffect) {
          actions.editEffect({
            type: "duplicate",
            effectId: selectedEffect.id,
            newEffectId: createId("effect"),
            startFrame: selectedEffect.startFrame + 1
          });
        } else {
          actions.duplicateObject();
        }
      } else if (!isTextInput && event.key === "Delete") {
        event.preventDefault();
        actions.selectedEffectId
          ? actions.deleteEffect(actions.selectedEffectId)
          : actions.deleteObject();
      } else if (!isTextInput && event.code === "Space") {
        event.preventDefault();
        actions.togglePlayback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions]);
}
