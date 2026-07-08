import type { SkyPresetId } from "../renderer/SkySystem";
import type { Command } from "./Command";

export interface BuiltinCommandActions {
  newProject: () => void;
  saveProject: () => void;
  loadProject: () => void;
  addCharacter: () => void;
  addCamera: () => void;
  importObj: () => void;
  openSettings: () => void;
  openPluginManager: () => void;
  applySky: (sky: SkyPresetId) => void;
  togglePlayback: () => void;
  resetViewportCamera: () => void;
  addKeyframe: () => void;
  undo: () => void;
  redo: () => void;
}

export function createBuiltinCommands(actions: BuiltinCommandActions): Command[] {
  return [
    {
      id: "project.new",
      title: "New Project",
      group: "Project",
      run: actions.newProject
    },
    {
      id: "project.save",
      title: "Save Project",
      group: "Project",
      shortcut: "Ctrl+S",
      run: actions.saveProject
    },
    {
      id: "project.load",
      title: "Load Project",
      group: "Project",
      run: actions.loadProject
    },
    {
      id: "scene.addCharacter",
      title: "Add Character",
      group: "Scene",
      run: actions.addCharacter
    },
    {
      id: "scene.addCamera",
      title: "Add Camera",
      group: "Scene",
      run: actions.addCamera
    },
    {
      id: "scene.importObj",
      title: "Import OBJ",
      group: "Scene",
      run: actions.importObj
    },
    {
      id: "settings.open",
      title: "Open Settings",
      group: "Settings",
      run: actions.openSettings
    },
    {
      id: "plugins.open",
      title: "Open Plugin Manager",
      group: "Plugins",
      run: actions.openPluginManager
    },
    ...(["Day", "Sunset", "Night"] as SkyPresetId[]).map((sky) => ({
      id: `view.sky.${sky}`,
      title: `Apply Sky: ${sky}`,
      group: "View" as const,
      run: () => actions.applySky(sky)
    })),
    {
      id: "timeline.toggle",
      title: "Play/Pause Timeline",
      group: "Timeline",
      shortcut: "Space",
      run: actions.togglePlayback
    },
    {
      id: "view.resetCamera",
      title: "Reset Viewport Camera",
      group: "View",
      run: actions.resetViewportCamera
    },
    {
      id: "timeline.addKeyframe",
      title: "Add Keyframe",
      group: "Timeline",
      run: actions.addKeyframe
    },
    {
      id: "history.undo",
      title: "Undo",
      group: "Project",
      shortcut: "Ctrl+Z",
      run: actions.undo
    },
    {
      id: "history.redo",
      title: "Redo",
      group: "Project",
      shortcut: "Ctrl+Y",
      run: actions.redo
    }
  ];
}

