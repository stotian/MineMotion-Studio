import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssetManager } from "./assets/AssetManager";
import { ObjImporter } from "./assets/ObjImporter";
import { Animator } from "./animation/Animator";
import { addTransformKeyframes, setCurrentFrame } from "./animation/Timeline";
import { CommandPalette } from "./commands/CommandPalette";
import { createBuiltinCommands } from "./commands/BuiltinCommands";
import { HistoryStack } from "./history/HistoryStack";
import { WorldImporter } from "./minecraft/WorldImporter";
import { pluginRegistry } from "./plugins/PluginRegistry";
import { applyCameraPreset } from "./presets/CameraPresets";
import { presetRegistry } from "./presets/PresetRegistry";
import { applyRigPosePreset } from "./presets/RigPosePresets";
import type { MineMotionProject, ProjectSettings, TransformData } from "./project/ProjectFile";
import { ProjectSerializer } from "./project/ProjectSerializer";
import {
  createCharacter,
  createInitialProject,
  createObjEntity,
  createSceneCamera,
  findObject,
  updateObjectLocked,
  updateObjectName,
  updateObjectTransform,
  updateObjectVisibility,
  updateProjectSettings
} from "./project/ProjectStore";
import { type SkyPresetId } from "./renderer/SkySystem";
import { Viewport } from "./renderer/Viewport";
import { SettingsStore, type AppSettings } from "./settings/AppSettings";
import { templateRegistry } from "./templates/TemplateRegistry";
import { TopBar } from "./ui/TopBar";
import { HelpPanel } from "./ui/help/HelpPanel";
import { InspectorPanel } from "./ui/inspector/InspectorPanel";
import { OutlinerPanel } from "./ui/outliner/OutlinerPanel";
import { PluginManagerPanel } from "./ui/plugins/PluginManagerPanel";
import { SettingsModal } from "./ui/settings/SettingsModal";
import { TemplatePicker } from "./ui/templates/TemplatePicker";
import { TimelinePanel } from "./ui/timeline/TimelinePanel";

const AUTOSAVE_KEY = "minemotion.autosave.project.v1";

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() =>
    SettingsStore.load()
  );
  const [project, setProject] = useState<MineMotionProject>(() =>
    createInitialProject(settings)
  );
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    project.scene.characters[0]?.id ?? null
  );
  const [status, setStatus] = useState(
    "Ready. Phase 1.5 editor systems loaded."
  );
  const [isDirty, setIsDirty] = useState(false);
  const [lookThroughCameraRequest, setLookThroughCameraRequest] = useState(0);
  const [resetCameraRequest, setResetCameraRequest] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [pluginsOpen, setPluginsOpen] = useState(false);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [plugins, setPlugins] = useState(() => pluginRegistry.list());

  const historyRef = useRef(new HistoryStack<MineMotionProject>());
  const worldInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const objInputRef = useRef<HTMLInputElement | null>(null);
  const lastPlaybackTimeRef = useRef<number | null>(null);

  const presets = useMemo(() => presetRegistry.snapshot(), []);
  const templates = useMemo(() => templateRegistry.list(), []);
  const selectedObject = useMemo(
    () => findObject(project, selectedObjectId)?.entity ?? null,
    [project, selectedObjectId]
  );

  const displayProject = useMemo(
    () => Animator.sampleProject(project, project.animation.currentFrame),
    [project]
  );

  useEffect(() => {
    SettingsStore.save(settings);
    document.documentElement.style.setProperty(
      "--ui-scale",
      String(settings.editor.uiScale)
    );
  }, [settings]);

  useEffect(() => {
    const rawAutosave = window.localStorage.getItem(AUTOSAVE_KEY);
    if (!rawAutosave) return;

    const shouldRestore = window.confirm(
      "A MineMotion autosave was found in this browser. Restore it?"
    );
    if (!shouldRestore) return;

    try {
      const restored = ProjectSerializer.parse(rawAutosave);
      setProject(restored);
      setSelectedObjectId(restored.scene.characters[0]?.id ?? null);
      setStatus("Autosaved project restored from browser storage.");
      setIsDirty(true);
    } catch {
      window.localStorage.removeItem(AUTOSAVE_KEY);
      setStatus("Autosave was invalid and has been cleared.");
    }
  }, []);

  useEffect(() => {
    if (!settings.general.autosaveEnabled || !isDirty) return;

    const interval = window.setInterval(() => {
      window.localStorage.setItem(AUTOSAVE_KEY, ProjectSerializer.serialize(project));
      setStatus(`Autosaved ${project.projectName} to browser storage.`);
    }, settings.general.autosaveIntervalSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [
    isDirty,
    project,
    settings.general.autosaveEnabled,
    settings.general.autosaveIntervalSeconds
  ]);

  useEffect(() => {
    if (!project.animation.isPlaying) {
      lastPlaybackTimeRef.current = null;
      return;
    }

    let animationFrame = 0;
    const tick = (time: number) => {
      setProject((currentProject) => {
        const lastTime = lastPlaybackTimeRef.current ?? time;
        lastPlaybackTimeRef.current = time;
        const elapsedSeconds = (time - lastTime) / 1000;
        const frameStep = elapsedSeconds * currentProject.animation.fps;
        const nextFrame = currentProject.animation.currentFrame + frameStep;
        const reachedEnd = nextFrame >= currentProject.animation.durationFrames;

        return {
          ...currentProject,
          animation: {
            ...currentProject.animation,
            currentFrame: reachedEnd
              ? currentProject.animation.durationFrames
              : Math.round(nextFrame),
            isPlaying: reachedEnd ? false : currentProject.animation.isPlaying
          }
        };
      });
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [project.animation.isPlaying]);

  const commitProject = useCallback(
    (
      updater: MineMotionProject | ((currentProject: MineMotionProject) => MineMotionProject),
      label: string
    ) => {
      setProject((currentProject) => {
        const nextProject =
          typeof updater === "function" ? updater(currentProject) : updater;
        historyRef.current.push(currentProject, label);
        setIsDirty(true);
        return nextProject;
      });
    },
    []
  );

  const replaceProject = useCallback((nextProject: MineMotionProject, label: string) => {
    historyRef.current.clear();
    setProject(nextProject);
    setSelectedObjectId(nextProject.scene.characters[0]?.id ?? nextProject.scene.cameras[0]?.id ?? null);
    setIsDirty(true);
    setStatus(label);
  }, []);

  const confirmDiscardChanges = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm("Current project has unsaved changes. Continue?");
  }, [isDirty]);

  const handleSelectObject = useCallback((objectId: string | null) => {
    setSelectedObjectId(objectId);
  }, []);

  const handleNewProject = useCallback(() => {
    if (!confirmDiscardChanges()) return;
    replaceProject(createInitialProject(settings), "New project created.");
  }, [confirmDiscardChanges, replaceProject, settings]);

  const handleNewProjectFromTemplate = useCallback(
    (templateId: string) => {
      if (!confirmDiscardChanges()) return;
      const nextProject = templateRegistry.createProject(templateId, settings);
      replaceProject(nextProject, `Template loaded: ${nextProject.projectName}.`);
      setTemplatesOpen(false);
    },
    [confirmDiscardChanges, replaceProject, settings]
  );

  const handleSaveProject = useCallback(() => {
    const raw = ProjectSerializer.serialize(project);
    const blob = new Blob([raw], { type: "application/json" });
    const link = document.createElement("a");
    const filename = `${project.projectName
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "minemotion-project"}.mmsproj`;
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);

    setSettings((currentSettings) =>
      SettingsStore.addRecentProject(currentSettings, {
        id: filename,
        name: project.projectName,
        savedAt: new Date().toISOString(),
        storageHint: "download"
      })
    );
    setIsDirty(false);
    setStatus(`Project saved as ${filename}.`);
  }, [project]);

  const handleLoadProject = useCallback(() => {
    projectInputRef.current?.click();
  }, []);

  const handleProjectFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !confirmDiscardChanges()) return;

    try {
      const loadedProject = ProjectSerializer.parse(await file.text());
      historyRef.current.clear();
      setProject(loadedProject);
      setSelectedObjectId(loadedProject.scene.characters[0]?.id ?? null);
      setIsDirty(false);
      setSettings((currentSettings) =>
        SettingsStore.addRecentProject(currentSettings, {
          id: file.name,
          name: loadedProject.projectName,
          savedAt: new Date().toISOString(),
          storageHint: "browser"
        })
      );
      setStatus(`Loaded project ${loadedProject.projectName}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load project.");
    }
  };

  const handleOpenWorld = useCallback(() => {
    worldInputRef.current?.click();
  }, []);

  const handleWorldSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;

    const importedWorld = await WorldImporter.importFromFileList(files);
    commitProject(
      (currentProject) =>
        updateProjectSettings(
          {
            ...currentProject,
            world: importedWorld
          },
          {
            worldSourcePath: importedWorld.sourcePath ?? importedWorld.sourceName
          }
        ),
      "Scan world folder"
    );
    setSelectedObjectId("world");
    setStatus(
      `World scan complete: ${importedWorld.sourceName}, ${importedWorld.dimensions
        .map((dimension) => `${dimension.label} ${dimension.regionFiles.length}`)
        .join(", ")} region files.`
    );
  };

  const handleAddCharacter = useCallback(() => {
    const character = createCharacter(
      `Character ${project.scene.characters.length + 1}`,
      [project.scene.characters.length * 1.5, 1.05, 0]
    );
    commitProject(
      (currentProject) => ({
        ...currentProject,
        scene: {
          ...currentProject.scene,
          characters: [...currentProject.scene.characters, character]
        }
      }),
      "Add character"
    );
    setSelectedObjectId(character.id);
    setStatus(`Added ${character.name}.`);
  }, [commitProject, project.scene.characters.length]);

  const handleAddCamera = useCallback(() => {
    const camera = createSceneCamera(`Camera ${project.scene.cameras.length + 1}`);
    commitProject(
      (currentProject) => ({
        ...currentProject,
        scene: {
          ...currentProject.scene,
          cameras: [...currentProject.scene.cameras, camera]
        }
      }),
      "Add camera"
    );
    setSelectedObjectId(camera.id);
    setStatus(`Added ${camera.name}.`);
  }, [commitProject, project.scene.cameras.length]);

  const handleImportObj = useCallback(() => {
    objInputRef.current?.click();
  }, []);

  const handleObjSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const imported = await ObjImporter.fromFile(file);
      let createdObjectId = "";
      commitProject(
        (currentProject) => {
          const { project: withAsset, asset } = AssetManager.addObjAsset(
            currentProject,
            imported.name,
            imported.rawObj
          );
          const entity = createObjEntity(asset.id, imported.name);
          createdObjectId = entity.id;
          return {
            ...withAsset,
            scene: {
              ...withAsset.scene,
              importedObjects: [...withAsset.scene.importedObjects, entity]
            }
          };
        },
        "Import OBJ"
      );
      setSelectedObjectId(createdObjectId);
      setStatus(
        imported.warnings.length
          ? `Imported OBJ with warning: ${imported.warnings.join(" ")}`
          : `Imported OBJ ${imported.name}.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import OBJ.");
    }
  };

  const handleUpdateTransform = useCallback(
    (objectId: string, transform: TransformData) => {
      const lookup = findObject(project, objectId);
      if (lookup?.entity.locked) {
        setStatus(`${lookup.entity.name} is locked.`);
        return;
      }
      commitProject(
        (currentProject) =>
          updateObjectTransform(currentProject, objectId, transform),
        "Change transform"
      );
    },
    [commitProject, project]
  );

  const handleRenameObject = useCallback(
    (objectId: string, name: string) => {
      commitProject(
        (currentProject) => updateObjectName(currentProject, objectId, name),
        "Rename object"
      );
    },
    [commitProject]
  );

  const handleToggleVisibility = useCallback(
    (objectId: string, visible: boolean) => {
      commitProject(
        (currentProject) =>
          updateObjectVisibility(currentProject, objectId, visible),
        "Toggle object visibility"
      );
    },
    [commitProject]
  );

  const handleToggleLocked = useCallback(
    (objectId: string, locked: boolean) => {
      commitProject(
        (currentProject) => updateObjectLocked(currentProject, objectId, locked),
        "Toggle object lock"
      );
    },
    [commitProject]
  );

  const handleAddKeyframe = useCallback(() => {
    if (!selectedObjectId || selectedObjectId === "world") {
      setStatus("Select a character, camera, light, or OBJ before keyframing.");
      return;
    }

    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus("Selected object is not keyframeable.");
      return;
    }

    commitProject(
      (currentProject) =>
        addTransformKeyframes(
          currentProject,
          selectedObjectId,
          currentProject.animation.currentFrame
        ),
      "Add keyframe"
    );
    setStatus(
      `Transform keyframe added for ${lookup.entity.name} at frame ${project.animation.currentFrame}.`
    );
  }, [commitProject, project, selectedObjectId]);

  const handleSkyChange = useCallback(
    (preset: SkyPresetId, customColor: string) => {
      commitProject(
        (currentProject) =>
          updateProjectSettings(
            {
              ...currentProject,
              sky: {
                preset,
                customColor
              }
            },
            {
              defaultSkyPreset: preset
            }
          ),
        "Change sky"
      );
      setStatus(`Sky preset set to ${preset}.`);
    },
    [commitProject]
  );

  const handleProjectSettingsChange = useCallback(
    (projectSettings: ProjectSettings) => {
      commitProject(
        (currentProject) => updateProjectSettings(currentProject, projectSettings),
        "Change project settings"
      );
      setStatus("Project settings updated.");
    },
    [commitProject]
  );

  const handleSetFrame = useCallback((frame: number) => {
    setProject((currentProject) => ({
      ...currentProject,
      animation: setCurrentFrame(currentProject.animation, frame)
    }));
  }, []);

  const handleSetFps = useCallback(
    (fps: number) => {
      const safeFps = Math.min(120, Math.max(1, Math.round(fps || 1)));
      commitProject(
        (currentProject) =>
          updateProjectSettings(currentProject, {
            fps: safeFps
          }),
        "Change FPS"
      );
    },
    [commitProject]
  );

  const handleTogglePlayback = useCallback(() => {
    setProject((currentProject) => ({
      ...currentProject,
      animation: {
        ...currentProject.animation,
        currentFrame:
          currentProject.animation.currentFrame >=
          currentProject.animation.durationFrames
            ? 0
            : currentProject.animation.currentFrame,
        isPlaying: !currentProject.animation.isPlaying
      }
    }));
  }, []);

  const handleLookThroughCamera = useCallback(() => {
    if (findObject(project, selectedObjectId)?.entity.type !== "camera") {
      setStatus("Select a scene camera first.");
      return;
    }
    setLookThroughCameraRequest((value) => value + 1);
    setStatus("Viewport moved to selected camera position.");
  }, [project, selectedObjectId]);

  const handleResetViewportCamera = useCallback(() => {
    setResetCameraRequest((value) => value + 1);
    setStatus("Viewport camera reset to the first scene camera.");
  }, []);

  const handleApplyCameraPreset = useCallback(
    (presetId: string) => {
      if (!selectedObjectId) return;
      const preset = presetRegistry.getCameraPreset(presetId);
      if (!preset) return;
      commitProject(
        (currentProject) => ({
          ...currentProject,
          scene: {
            ...currentProject.scene,
            cameras: currentProject.scene.cameras.map((camera) =>
              camera.id === selectedObjectId
                ? applyCameraPreset(camera, preset)
                : camera
            )
          }
        }),
        "Apply camera preset"
      );
      setStatus(`Camera preset applied: ${preset.name}.`);
    },
    [commitProject, selectedObjectId]
  );

  const handleApplyRigPosePreset = useCallback(
    (presetId: string) => {
      if (!selectedObjectId) return;
      const preset = presetRegistry.getRigPosePreset(presetId);
      if (!preset) return;
      commitProject(
        (currentProject) => ({
          ...currentProject,
          scene: {
            ...currentProject.scene,
            characters: currentProject.scene.characters.map((character) =>
              character.id === selectedObjectId
                ? applyRigPosePreset(character, preset)
                : character
            )
          }
        }),
        "Apply rig pose preset"
      );
      setStatus(`Pose applied: ${preset.name}.`);
    },
    [commitProject, selectedObjectId]
  );

  const handleApplyAnimationPreset = useCallback(
    (presetId: string) => {
      if (!selectedObjectId) return;
      const preset = presetRegistry.getAnimationPreset(presetId);
      if (!preset) return;
      commitProject(
        (currentProject) => preset.apply(currentProject, selectedObjectId),
        "Apply animation preset"
      );
      setStatus(`Animation preset applied: ${preset.name}.`);
    },
    [commitProject, selectedObjectId]
  );

  const handleUndo = useCallback(() => {
    setProject((currentProject) => {
      const previousProject = historyRef.current.undo(currentProject);
      if (!previousProject) {
        setStatus("Nothing to undo.");
        return currentProject;
      }
      setIsDirty(true);
      setStatus("Undo.");
      return previousProject;
    });
  }, []);

  const handleRedo = useCallback(() => {
    setProject((currentProject) => {
      const nextProject = historyRef.current.redo(currentProject);
      if (!nextProject) {
        setStatus("Nothing to redo.");
        return currentProject;
      }
      setIsDirty(true);
      setStatus("Redo.");
      return nextProject;
    });
  }, []);

  const handleTogglePlugin = useCallback(
    (pluginId: string, enabled: boolean) => {
      pluginRegistry.setEnabled(pluginId, enabled);
      setPlugins(pluginRegistry.list());
      setSettings((currentSettings) => ({
        ...currentSettings,
        plugins: {
          ...currentSettings.plugins,
          disabledPluginIds: enabled
            ? currentSettings.plugins.disabledPluginIds.filter(
                (id) => id !== pluginId
              )
            : [...new Set([...currentSettings.plugins.disabledPluginIds, pluginId])]
        }
      }));
      setStatus(`${enabled ? "Enabled" : "Disabled"} plugin ${pluginId}.`);
    },
    []
  );

  const handleLoadSampleScene = useCallback(() => {
    handleNewProjectFromTemplate("sunset-showcase");
    setHelpOpen(false);
  }, [handleNewProjectFromTemplate]);

  const commands = useMemo(
    () =>
      createBuiltinCommands({
        newProject: handleNewProject,
        saveProject: handleSaveProject,
        loadProject: handleLoadProject,
        addCharacter: handleAddCharacter,
        addCamera: handleAddCamera,
        importObj: handleImportObj,
        openSettings: () => setSettingsOpen(true),
        openPluginManager: () => setPluginsOpen(true),
        applySky: (sky) => handleSkyChange(sky, project.sky.customColor),
        togglePlayback: handleTogglePlayback,
        resetViewportCamera: handleResetViewportCamera,
        addKeyframe: handleAddKeyframe,
        undo: handleUndo,
        redo: handleRedo
      }),
    [
      handleAddCamera,
      handleAddCharacter,
      handleAddKeyframe,
      handleImportObj,
      handleLoadProject,
      handleNewProject,
      handleRedo,
      handleResetViewportCamera,
      handleSaveProject,
      handleSkyChange,
      handleTogglePlayback,
      handleUndo,
      project.sky.customColor
    ]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "p") {
        event.preventDefault();
        setCommandsOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
        handleSaveProject();
      }
      if ((event.ctrlKey || event.metaKey) && key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }
      if (
        ((event.ctrlKey || event.metaKey) && key === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && key === "z")
      ) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRedo, handleSaveProject, handleUndo]);

  const statusDetails = [
    `Selected: ${selectedObject?.name ?? "none"}`,
    `Frame: ${project.animation.currentFrame}`,
    `FPS: ${project.animation.fps}`,
    isDirty ? "Unsaved" : "Saved",
    project.world ? `World: ${project.world.sourceName}` : "World: demo"
  ].join(" | ");

  return (
    <main className="app-shell">
      <TopBar
        projectName={project.projectName}
        isPlaying={project.animation.isPlaying}
        isDirty={isDirty}
        onNewProject={handleNewProject}
        onNewProjectFromTemplate={() => setTemplatesOpen(true)}
        onOpenWorld={handleOpenWorld}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onAddCharacter={handleAddCharacter}
        onAddCamera={handleAddCamera}
        onImportObj={handleImportObj}
        onTogglePlayback={handleTogglePlayback}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPlugins={() => setPluginsOpen(true)}
        onOpenCommands={() => setCommandsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <div className="workspace">
        <OutlinerPanel
          project={project}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
        />
        <Viewport
          project={displayProject}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
          lookThroughCameraRequest={lookThroughCameraRequest}
          resetCameraRequest={resetCameraRequest}
          viewportSettings={settings.viewport}
        />
        <InspectorPanel
          project={project}
          selectedObjectId={selectedObjectId}
          onUpdateTransform={handleUpdateTransform}
          onRenameObject={handleRenameObject}
          onToggleVisibility={handleToggleVisibility}
          onToggleLocked={handleToggleLocked}
          onAddKeyframe={handleAddKeyframe}
          onSkyChange={handleSkyChange}
          onLookThroughCamera={handleLookThroughCamera}
          cameraPresets={presets.camera}
          rigPosePresets={presets.rigPose}
          animationPresets={presets.animation}
          onApplyCameraPreset={handleApplyCameraPreset}
          onApplyRigPosePreset={handleApplyRigPosePreset}
          onApplyAnimationPreset={handleApplyAnimationPreset}
        />
      </div>
      <TimelinePanel
        project={project}
        selectedObjectId={selectedObjectId}
        onSetFrame={handleSetFrame}
        onSetFps={handleSetFps}
        onTogglePlayback={handleTogglePlayback}
        onAddKeyframe={handleAddKeyframe}
      />
      <div className="status-bar">
        <span>{status}</span>
        <strong>{statusDetails}</strong>
      </div>
      <SettingsModal
        open={settingsOpen}
        appSettings={settings}
        projectSettings={project.projectSettings}
        onClose={() => setSettingsOpen(false)}
        onAppSettingsChange={setSettings}
        onProjectSettingsChange={handleProjectSettingsChange}
      />
      <TemplatePicker
        open={templatesOpen}
        templates={templates}
        onClose={() => setTemplatesOpen(false)}
        onCreateFromTemplate={handleNewProjectFromTemplate}
      />
      <PluginManagerPanel
        open={pluginsOpen}
        plugins={plugins}
        onClose={() => setPluginsOpen(false)}
        onTogglePlugin={handleTogglePlugin}
      />
      <CommandPalette
        open={commandsOpen}
        commands={commands}
        onClose={() => setCommandsOpen(false)}
      />
      <HelpPanel
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onLoadSampleScene={handleLoadSampleScene}
      />
      <input
        ref={worldInputRef}
        className="hidden-input"
        type="file"
        multiple
        {...{ webkitdirectory: "", directory: "" }}
        onChange={handleWorldSelected}
      />
      <input
        ref={projectInputRef}
        className="hidden-input"
        type="file"
        accept=".mmsproj,.minemotion,.json,application/json"
        onChange={handleProjectFileSelected}
      />
      <input
        ref={objInputRef}
        className="hidden-input"
        type="file"
        accept=".obj"
        onChange={handleObjSelected}
      />
    </main>
  );
}

