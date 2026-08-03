import { describe, expect, it } from "vitest";
import { createLocalizationService } from "../localization/LocalizationService";
import { findShortcutConflicts } from "../ui/workspaces/ShortcutDiagnostics";
import { createBuiltinCommands, type BuiltinCommandActions } from "./BuiltinCommands";

const noop = () => undefined;
const actions: BuiltinCommandActions = {
  newProject: noop, saveProject: noop, loadProject: noop, addCharacter: noop,
  addCamera: noop, importObj: noop, duplicateSelected: noop, deleteSelected: noop,
  openSettings: noop, openPluginManager: noop, openExportPanel: noop,
  exportCurrentFrame: noop, exportPngSequence: noop, savePackage: noop,
  exportLegacyProject: noop, applySky: noop, togglePlayback: noop,
  resetViewportCamera: noop, addKeyframe: noop, addEffect: noop,
  toggleRenderPreview: noop, toggleCinematicBars: noop, applyPostPreset: noop,
  undo: noop, redo: noop
};

describe("built-in shortcut map", () => {
  it("contains no ambiguous shortcuts", () => {
    const commands = createBuiltinCommands(actions, createLocalizationService({ preference: "en" }));
    expect(findShortcutConflicts(commands)).toEqual([]);
  });
});
