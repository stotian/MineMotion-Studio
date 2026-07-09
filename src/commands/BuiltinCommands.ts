import type { SkyPresetId } from "../renderer/SkySystem";
import type { EffectType } from "../effects/EffectTypes";
import type { PostProcessingPresetId } from "../rendering/postprocessing/PostProcessingTypes";
import type { Command } from "./Command";

export interface BuiltinCommandActions {
  newProject: () => void;
  saveProject: () => void;
  loadProject: () => void;
  addCharacter: () => void;
  addCamera: () => void;
  importObj: () => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  openSettings: () => void;
  openPluginManager: () => void;
  openExportPanel: () => void;
  exportCurrentFrame: () => void;
  exportPngSequence: () => void;
  savePackage: () => void;
  exportLegacyProject: () => void;
  applySky: (sky: SkyPresetId) => void;
  togglePlayback: () => void;
  resetViewportCamera: () => void;
  addKeyframe: () => void;
  addEffect: (type: EffectType) => void;
  toggleRenderPreview: () => void;
  toggleCinematicBars: () => void;
  applyPostPreset: (presetId: PostProcessingPresetId) => void;
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
      id: "project.savePackage",
      title: "Save .minemotion Package",
      group: "Project",
      shortcut: "Ctrl+S",
      run: actions.savePackage
    },
    {
      id: "project.exportLegacy",
      title: "Export Legacy .mmsproj",
      group: "Project",
      run: actions.exportLegacyProject
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
      id: "scene.duplicateSelected",
      title: "Duplicate Selected Object",
      group: "Scene",
      shortcut: "Ctrl+D",
      run: actions.duplicateSelected
    },
    {
      id: "scene.deleteSelected",
      title: "Delete Selected Object",
      group: "Scene",
      shortcut: "Delete",
      run: actions.deleteSelected
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
    ...([
      ["lightningStrike", "Add Lightning Strike"],
      ["impactFrame", "Add Impact Frame"],
      ["cameraShake", "Add Camera Shake"],
      ["flash", "Add Flash"],
      ["speedLines", "Add Speed Lines"],
      ["shockwave", "Add Shockwave"],
      ["glowBurst", "Add Glow Burst"]
    ] as Array<[EffectType, string]>).map(([type, title]) => ({
      id: `effects.${type}`,
      title,
      group: "Effects" as const,
      run: () => actions.addEffect(type)
    })),
    {
      id: "render.togglePreview",
      title: "Toggle Render Preview",
      group: "Render",
      run: actions.toggleRenderPreview
    },
    {
      id: "render.toggleBars",
      title: "Toggle Cinematic Bars",
      group: "Render",
      run: actions.toggleCinematicBars
    },
    {
      id: "render.openExport",
      title: "Open Export Panel",
      group: "Render",
      run: actions.openExportPanel
    },
    {
      id: "render.exportFrame",
      title: "Export Current Frame PNG",
      group: "Render",
      run: actions.exportCurrentFrame
    },
    {
      id: "render.exportSequence",
      title: "Export PNG Sequence ZIP",
      group: "Render",
      run: actions.exportPngSequence
    },
    ...([
      ["cinematic-warm", "Post: Cinematic Warm"],
      ["dark-horror", "Post: Dark Horror"],
      ["anime-impact", "Post: Anime Impact"],
      ["retro-pixel", "Post: Retro Pixel"]
    ] as Array<[PostProcessingPresetId, string]>).map(([presetId, title]) => ({
      id: `post.${presetId}`,
      title,
      group: "Post" as const,
      run: () => actions.applyPostPreset(presetId)
    })),
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
