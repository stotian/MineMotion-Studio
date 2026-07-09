import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssetManager } from "./assets/AssetManager";
import { ObjImporter } from "./assets/ObjImporter";
import { AudioManager } from "./audio/AudioManager";
import { createBuiltinAudioClip, createImportedAudioClip } from "./audio/AudioClip";
import { findClipsStartingAtFrame } from "./audio/AudioTimelineIntegration";
import { BUILTIN_SFX, getBuiltinSfx } from "./audio/BuiltinSfxRegistry";
import { exportProjectWav } from "./audio/export/AudioMixdown";
import { Animator } from "./animation/Animator";
import { addTransformKeyframes, setCurrentFrame } from "./animation/Timeline";
import { CommandPalette } from "./commands/CommandPalette";
import { createBuiltinCommands } from "./commands/BuiltinCommands";
import { effectRegistry } from "./effects/EffectRegistry";
import type { EffectInstance, EffectType } from "./effects/EffectTypes";
import { spawnEffectAtFrame } from "./effects/EffectSpawner";
import { exportCurrentFramePng } from "./export/FrameExporter";
import { createExportProgress, IDLE_EXPORT_PROGRESS } from "./export/ExportProgress";
import {
  sanitizeOutputName,
  validateExportSettings,
  withExportSettingsDefaults
} from "./export/ExportSettings";
import type { ExportResult, ExportSettings } from "./export/ExportTypes";
import { exportPngSequenceZip } from "./export/SequenceExporter";
import { recordCanvasWebM } from "./export/video/WebMRecorder";
import { HistoryStack } from "./history/HistoryStack";
import type { MinecraftWorldScan } from "./minecraft/import/MinecraftChunkTypes";
import {
  DEFAULT_WORLD_IMPORT_OPTIONS,
  WorldImportManager,
  type WorldChunkImportOptions
} from "./minecraft/import/WorldImportManager";
import {
  createWorldImportProgress,
  IDLE_WORLD_IMPORT_PROGRESS
} from "./minecraft/import/WorldImportProgress";
import { pluginRegistry } from "./plugins/PluginRegistry";
import { applyCameraPreset } from "./presets/CameraPresets";
import { presetRegistry } from "./presets/PresetRegistry";
import { applyRigPosePreset } from "./presets/RigPosePresets";
import { syncCinematicTimeline } from "./project/CinematicTimeline";
import { PackageReader } from "./project/package/PackageReader";
import { PackageWriter } from "./project/package/PackageWriter";
import type {
  CameraEntity,
  MineMotionProject,
  ProjectSettings,
  TransformData
} from "./project/ProjectFile";
import { ProjectSerializer } from "./project/ProjectSerializer";
import {
  createCharacter,
  createId,
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
import {
  getPostProcessingPreset,
  POST_PROCESSING_PRESETS
} from "./rendering/postprocessing/PostProcessingPresets";
import type {
  PostProcessingPresetId,
  PostProcessingSettings
} from "./rendering/postprocessing/PostProcessingTypes";
import { renderViewportFrameToPng } from "./rendering/export/OfflineFrameRenderer";
import { createRenderStateSnapshot } from "./rendering/export/RenderStateSnapshot";
import { restoreRenderState } from "./rendering/export/RenderStateRestore";
import { type SkyPresetId } from "./renderer/SkySystem";
import { Viewport } from "./renderer/Viewport";
import { SettingsStore, type AppSettings } from "./settings/AppSettings";
import { templateRegistry } from "./templates/TemplateRegistry";
import { TopBar } from "./ui/TopBar";
import { EffectsLibraryPanel } from "./ui/effects/EffectsLibraryPanel";
import { ExportPanel } from "./ui/export/ExportPanel";
import { HelpPanel } from "./ui/help/HelpPanel";
import { InspectorPanel } from "./ui/inspector/InspectorPanel";
import { OutlinerPanel } from "./ui/outliner/OutlinerPanel";
import { PluginManagerPanel } from "./ui/plugins/PluginManagerPanel";
import { SettingsModal } from "./ui/settings/SettingsModal";
import { TemplatePicker } from "./ui/templates/TemplatePicker";
import { TimelinePanel } from "./ui/timeline/TimelinePanel";
import { WorldImportPanel } from "./ui/world/WorldImportPanel";

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
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [status, setStatus] = useState(
    "Ready. Phase 3 export and package systems loaded."
  );
  const [isDirty, setIsDirty] = useState(false);
  const [lookThroughCameraRequest, setLookThroughCameraRequest] = useState(0);
  const [resetCameraRequest, setResetCameraRequest] = useState(0);
  const [focusWorldRequest, setFocusWorldRequest] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [pluginsOpen, setPluginsOpen] = useState(false);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [worldImportOpen, setWorldImportOpen] = useState(false);
  const [worldScan, setWorldScan] = useState<MinecraftWorldScan | null>(null);
  const [worldImportOptions, setWorldImportOptions] =
    useState<WorldChunkImportOptions>(DEFAULT_WORLD_IMPORT_OPTIONS);
  const [worldImportProgress, setWorldImportProgress] = useState(
    IDLE_WORLD_IMPORT_PROGRESS
  );
  const [exportProgress, setExportProgress] = useState(IDLE_EXPORT_PROGRESS);
  const [plugins, setPlugins] = useState(() => pluginRegistry.list());

  const historyRef = useRef(new HistoryStack<MineMotionProject>());
  const worldInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const objInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const lastPlaybackTimeRef = useRef<number | null>(null);
  const previousAudioFrameRef = useRef(0);
  const exportCancelledRef = useRef(false);
  const worldImportCancelledRef = useRef(false);

  const presets = useMemo(() => presetRegistry.snapshot(), []);
  const templates = useMemo(() => templateRegistry.list(), []);
  const effectDefinitions = useMemo(() => effectRegistry.list(), []);
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
    audioManagerRef.current ??= new AudioManager();
    if (!project.animation.isPlaying) {
      previousAudioFrameRef.current = project.animation.currentFrame;
      return;
    }

    const previousFrame = previousAudioFrameRef.current;
    const currentFrame = project.animation.currentFrame;
    const clips = findClipsStartingAtFrame(
      project.audio.clips,
      currentFrame,
      previousFrame
    );
    for (const clip of clips) {
      audioManagerRef.current.playClip(clip);
    }
    previousAudioFrameRef.current = currentFrame;
  }, [
    project.animation.currentFrame,
    project.animation.isPlaying,
    project.audio.clips
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
    setSelectedEffectId(null);
    setIsDirty(true);
    setStatus(label);
  }, []);

  const confirmDiscardChanges = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm("Current project has unsaved changes. Continue?");
  }, [isDirty]);

  const handleSelectObject = useCallback((objectId: string | null) => {
    setSelectedObjectId(objectId);
    setSelectedEffectId(null);
  }, []);

  const handleSelectEffect = useCallback((effectId: string) => {
    setSelectedEffectId(effectId);
    setSelectedObjectId(null);
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
    const filename = `${sanitizeOutputName(project.projectName)}.minemotion`;
    downloadBlob(PackageWriter.write(project), filename);

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

  const handleExportLegacyProject = useCallback(() => {
    const raw = ProjectSerializer.serialize(project);
    const blob = new Blob([raw], { type: "application/json" });
    const filename = `${sanitizeOutputName(project.projectName)}.mmsproj`;
    downloadBlob(blob, filename);
    setStatus(`Legacy project exported as ${filename}.`);
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
      const raw = await file.text();
      const loadedProject = PackageReader.looksLikePackage(raw)
        ? PackageReader.parse(raw)
        : ProjectSerializer.parse(raw);
      historyRef.current.clear();
      setProject(loadedProject);
      setSelectedObjectId(
        loadedProject.scene.characters[0]?.id ??
          loadedProject.scene.cameras[0]?.id ??
          null
      );
      setSelectedEffectId(null);
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
    setWorldImportOpen(true);
    worldInputRef.current?.click();
  }, []);

  const handleChooseWorldFolder = useCallback(() => {
    worldInputRef.current?.click();
  }, []);

  const handleWorldSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;

    try {
      setWorldImportProgress(
        createWorldImportProgress({
          status: "scanning",
          message: "Scanning Minecraft world folder."
        })
      );
      const scan = await WorldImportManager.scan(files);
      const spawn = scan.level.spawn;
      const nextOptions: WorldChunkImportOptions = {
        ...worldImportOptions,
        centerChunkX: spawn ? Math.floor(spawn[0] / 16) : worldImportOptions.centerChunkX,
        centerChunkZ: spawn ? Math.floor(spawn[2] / 16) : worldImportOptions.centerChunkZ
      };
      const scannedWorld = WorldImportManager.createSummaryFromScan(
        scan,
        nextOptions
      );
      setWorldScan(scan);
      setWorldImportOptions(nextOptions);
      setWorldImportOpen(true);
      commitProject(
        (currentProject) =>
          updateProjectSettings(
            {
              ...currentProject,
              world: scannedWorld
            },
            {
              worldSourcePath: scannedWorld.sourcePath ?? scannedWorld.sourceName
            }
          ),
        "Scan world folder"
      );
      setSelectedObjectId("world");
      setWorldImportProgress(
        createWorldImportProgress({
          status: "complete",
          current: scan.dimensions.reduce(
            (sum, dimension) => sum + dimension.regionFiles.length,
            0
          ),
          total: scan.dimensions.reduce(
            (sum, dimension) => sum + dimension.regionFiles.length,
            0
          ),
          message: `Scanned ${scan.sourceName}.`
        })
      );
      setStatus(
        `World scan complete: ${scan.sourceName}, ${scan.dimensions
          .map((dimension) => `${dimension.label} ${dimension.regionFiles.length}`)
          .join(", ")} region files.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not scan world folder.";
      setWorldImportProgress(
        createWorldImportProgress({
          status: "error",
          message,
          error: message
        })
      );
      setStatus(message);
    }
  };

  const handleWorldImportOptionsChange = useCallback(
    (options: WorldChunkImportOptions) => {
      setWorldImportOptions(options);
      setProject((currentProject) =>
        currentProject.world
          ? {
              ...currentProject,
              world: {
                ...currentProject.world,
                selectedDimension: options.dimension,
                importSettings: {
                  dimension: options.dimension,
                  centerChunkX: options.centerChunkX,
                  centerChunkZ: options.centerChunkZ,
                  radiusChunks: options.radiusChunks,
                  maxChunks: options.maxChunks,
                  maxRegionFiles: options.maxRegionFiles,
                  maxVerticalSections: options.maxVerticalSections
                },
                renderOptions: {
                  showChunkBorders: options.showChunkBorders,
                  showWorldOrigin: options.showWorldOrigin
                }
              }
            }
          : currentProject
      );
      if (project.world) {
        setIsDirty(true);
      }
    },
    [project.world]
  );

  const handleImportWorldChunks = useCallback(async () => {
    if (!worldScan) {
      setStatus("Choose a Minecraft world folder before importing chunks.");
      return;
    }

    worldImportCancelledRef.current = false;
    setWorldImportProgress(
      createWorldImportProgress({
        status: "reading-regions",
        message: "Preparing chunk import."
      })
    );

    try {
      const result = await WorldImportManager.importChunks({
        scan: worldScan,
        importOptions: worldImportOptions,
        onProgress: setWorldImportProgress,
        isCancelled: () => worldImportCancelledRef.current
      });
      commitProject(
        (currentProject) =>
          updateProjectSettings(
            {
              ...currentProject,
              world: result.world,
              projectSettings: {
                ...currentProject.projectSettings,
                terrainPreset:
                  result.chunks.length > 0
                    ? "none"
                    : currentProject.projectSettings.terrainPreset
              }
            },
            {
              worldSourcePath: result.world.sourcePath ?? result.world.sourceName
            }
          ),
        "Import Minecraft chunks"
      );
      setSelectedObjectId("world");
      setFocusWorldRequest((value) => value + 1);
      setStatus(
        `Imported ${result.chunks.length} chunks and ${result.estimate.importedBlocks} blocks from ${result.world.sourceName}.`
      );
    } catch (error) {
      const cancelled = worldImportCancelledRef.current;
      const message =
        error instanceof Error ? error.message : "Minecraft chunk import failed.";
      setWorldImportProgress(
        createWorldImportProgress({
          status: cancelled ? "cancelled" : "error",
          message,
          error: cancelled ? "" : message
        })
      );
      setStatus(message);
    }
  }, [commitProject, worldImportOptions, worldScan]);

  const handleCancelWorldImport = useCallback(() => {
    worldImportCancelledRef.current = true;
    setWorldImportProgress(
      createWorldImportProgress({
        status: "cancelled",
        message: "World import cancellation requested."
      })
    );
    setStatus("World import cancellation requested.");
  }, []);

  const handleFocusWorld = useCallback(() => {
    setFocusWorldRequest((value) => value + 1);
    setStatus("Viewport focused on imported world.");
  }, []);

  const handleUnloadWorld = useCallback(() => {
    commitProject(
      (currentProject) =>
        updateProjectSettings(
          {
            ...currentProject,
            world: null
          },
          {
            worldSourcePath: "",
            terrainPreset: "demo"
          }
        ),
      "Unload Minecraft world"
    );
    setWorldScan(null);
    setSelectedObjectId(null);
    setStatus("Imported world unloaded; demo terrain restored.");
  }, [commitProject]);

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

  const handleImportAudio = useCallback(() => {
    audioInputRef.current?.click();
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

  const handleAddEffect = useCallback(
    (type: EffectType) => {
      const effect = spawnEffectAtFrame(
        type,
        project.animation.currentFrame,
        selectedObjectId ?? ""
      );
      commitProject(
        (currentProject) =>
          syncCinematicTimeline({
            ...currentProject,
            effects: {
              instances: [...currentProject.effects.instances, effect]
            }
          }),
        "Add cinematic effect"
      );
      setSelectedEffectId(effect.id);
      setSelectedObjectId(null);
      setStatus(`Added effect ${effect.name} at frame ${effect.startFrame}.`);
    },
    [commitProject, project.animation.currentFrame, selectedObjectId]
  );

  const handleUpdateEffect = useCallback(
    (effectId: string, patch: Partial<EffectInstance>) => {
      commitProject(
        (currentProject) =>
          syncCinematicTimeline({
            ...currentProject,
            effects: {
              instances: currentProject.effects.instances.map((effect) =>
                effect.id === effectId
                  ? {
                      ...effect,
                      ...patch,
                      parameters: patch.parameters
                        ? { ...effect.parameters, ...patch.parameters }
                        : effect.parameters
                    }
                  : effect
              )
            }
          }),
        "Edit cinematic effect"
      );
      setStatus("Effect updated.");
    },
    [commitProject]
  );

  const handleDeleteEffect = useCallback(
    (effectId: string) => {
      commitProject(
        (currentProject) =>
          syncCinematicTimeline({
            ...currentProject,
            effects: {
              instances: currentProject.effects.instances.filter(
                (effect) => effect.id !== effectId
              )
            }
          }),
        "Delete cinematic effect"
      );
      setSelectedEffectId(null);
      setStatus("Effect deleted.");
    },
    [commitProject]
  );

  const handleApplyPostPreset = useCallback(
    (presetId: PostProcessingPresetId) => {
      const preset = getPostProcessingPreset(presetId);
      commitProject(
        (currentProject) => ({
          ...currentProject,
          postProcessing: preset.settings
        }),
        "Apply post-processing preset"
      );
      setStatus(`Post-processing preset applied: ${preset.name}.`);
    },
    [commitProject]
  );

  const handleUpdatePostProcessing = useCallback(
    (postSettings: Partial<PostProcessingSettings>) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          postProcessing: {
            ...currentProject.postProcessing,
            ...postSettings
          }
        }),
        "Edit post-processing"
      );
      setStatus("Post-processing updated.");
    },
    [commitProject]
  );

  const handleToggleRenderPreview = useCallback(() => {
    commitProject(
      (currentProject) => ({
        ...currentProject,
        renderSettings: {
          ...currentProject.renderSettings,
          renderPreviewEnabled:
            !currentProject.renderSettings.renderPreviewEnabled
        }
      }),
      "Toggle render preview"
    );
    setStatus("Render preview toggled.");
  }, [commitProject]);

  const handleToggleCinematicBars = useCallback(() => {
    commitProject(
      (currentProject) => ({
        ...currentProject,
        renderSettings: {
          ...currentProject.renderSettings,
          cinematicBarsEnabled:
            !currentProject.renderSettings.cinematicBarsEnabled
        }
      }),
      "Toggle cinematic bars"
    );
    setStatus("Cinematic bars toggled.");
  }, [commitProject]);

  const handleExportSettingsChange = useCallback((settings: ExportSettings) => {
    setProject((currentProject) => ({
      ...currentProject,
      exportSettings: withExportSettingsDefaults(settings, currentProject)
    }));
    setIsDirty(true);
  }, []);

  const validateCurrentExport = useCallback(() => {
    const validation = validateExportSettings(project.exportSettings, project);
    if (!validation.valid) {
      const message = validation.errors.join(" ");
      setStatus(message);
      setExportProgress(
        createExportProgress({
          status: "error",
          message: "Export settings are invalid.",
          error: message
        })
      );
      return false;
    }
    if (validation.warnings.length > 0) {
      setStatus(validation.warnings.join(" "));
    }
    return true;
  }, [project]);

  const handleExportCurrentFrame = useCallback(async () => {
    if (!validateCurrentExport()) return;
    exportCancelledRef.current = false;
    setExportProgress(
      createExportProgress({
        status: "preparing",
        message: "Capturing current viewport frame."
      })
    );

    try {
      const result = await exportCurrentFramePng(
        getViewportShell(),
        project,
        project.exportSettings
      );
      downloadExportResult(result);
      setExportProgress(
        createExportProgress({
          status: "complete",
          currentFrame: 1,
          totalFrames: 1,
          message: `Exported ${result.filename}.`
        })
      );
      setStatus(`Exported ${result.filename}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "PNG export failed.";
      setExportProgress(
        createExportProgress({
          status: "error",
          message,
          error: message
        })
      );
      setStatus(message);
    }
  }, [project, validateCurrentExport]);

  const handleExportSequence = useCallback(async () => {
    if (!validateCurrentExport()) return;
    exportCancelledRef.current = false;
    const snapshot = createRenderStateSnapshot(project);
    const settings = project.exportSettings;
    setExportProgress(
      createExportProgress({
        status: "preparing",
        message: "Preparing PNG sequence export."
      })
    );

    try {
      const viewportShell = getViewportShell();
      const result = await exportPngSequenceZip({
        settings,
        onProgress: setExportProgress,
        isCancelled: () => exportCancelledRef.current,
        captureFrame: async (frame) => {
          setProject((currentProject) => ({
            ...currentProject,
            animation: {
              ...setCurrentFrame(currentProject.animation, frame),
              isPlaying: false
            }
          }));
          await waitForNextPaint();
          return await renderViewportFrameToPng(
            viewportShell,
            {
              ...project,
              animation: {
                ...project.animation,
                currentFrame: frame,
                isPlaying: false
              }
            },
            settings
          );
        }
      });
      downloadExportResult(result);
      setExportProgress(
        createExportProgress({
          status: "complete",
          currentFrame: settings.endFrame - settings.startFrame + 1,
          totalFrames: settings.endFrame - settings.startFrame + 1,
          message: `Exported ${result.filename}.`
        })
      );
      setStatus(`Exported ${result.filename}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "PNG sequence export failed.";
      setExportProgress(
        createExportProgress({
          status: exportCancelledRef.current ? "cancelled" : "error",
          message,
          error: exportCancelledRef.current ? "" : message
        })
      );
      setStatus(message);
    } finally {
      setProject((currentProject) => restoreRenderState(currentProject, snapshot));
    }
  }, [project, validateCurrentExport]);

  const handleExportWebM = useCallback(async () => {
    if (!validateCurrentExport()) return;
    exportCancelledRef.current = false;
    const settings = project.exportSettings;
    const snapshot = createRenderStateSnapshot(project);
    const totalFrames = settings.endFrame - settings.startFrame + 1;
    const frameDurationMs = 1000 / settings.fps;
    setExportProgress(
      createExportProgress({
        status: "preparing",
        totalFrames,
        message: "Recording viewport canvas as WebM."
      })
    );

    try {
      const canvas = getViewportShell().querySelector("canvas");
      if (!canvas) {
        throw new Error("No viewport canvas is available for WebM export.");
      }

      const recorder = recordCanvasWebM(
        canvas,
        totalFrames * frameDurationMs,
        settings.fps
      );
      for (
        let frame = settings.startFrame, index = 0;
        frame <= settings.endFrame;
        frame += 1, index += 1
      ) {
        if (exportCancelledRef.current) break;
        setProject((currentProject) => ({
          ...currentProject,
          animation: {
            ...setCurrentFrame(currentProject.animation, frame),
            isPlaying: false
          }
        }));
        setExportProgress(
          createExportProgress({
            status: "rendering",
            currentFrame: index + 1,
            totalFrames,
            message: `Recording frame ${index + 1} of ${totalFrames}.`
          })
        );
        await wait(frameDurationMs);
      }
      const blob = await recorder;
      const filename = `${sanitizeOutputName(settings.outputName)}.webm`;
      downloadBlob(blob, filename);
      setExportProgress(
        createExportProgress({
          status: "complete",
          currentFrame: totalFrames,
          totalFrames,
          message: `Exported ${filename}.`
        })
      );
      setStatus(`Exported ${filename}. WebM uses live viewport resolution.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "WebM export failed.";
      setExportProgress(
        createExportProgress({
          status: "error",
          message,
          error: message
        })
      );
      setStatus(message);
    } finally {
      setProject((currentProject) => restoreRenderState(currentProject, snapshot));
    }
  }, [project, validateCurrentExport]);

  const handleExportWav = useCallback(async () => {
    exportCancelledRef.current = false;
    setExportProgress(
      createExportProgress({
        status: "encoding",
        message: "Mixing project audio to WAV."
      })
    );

    try {
      const blob = await exportProjectWav(project);
      const filename = `${sanitizeOutputName(project.exportSettings.outputName)}.wav`;
      downloadBlob(blob, filename);
      setExportProgress(
        createExportProgress({
          status: "complete",
          currentFrame: 1,
          totalFrames: 1,
          message: `Exported ${filename}.`
        })
      );
      setStatus(`Exported ${filename}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "WAV export failed.";
      setExportProgress(
        createExportProgress({
          status: "error",
          message,
          error: message
        })
      );
      setStatus(message);
    }
  }, [project]);

  const handleCancelExport = useCallback(() => {
    exportCancelledRef.current = true;
    setExportProgress(
      createExportProgress({
        status: "cancelled",
        message: "Export cancellation requested."
      })
    );
    setStatus("Export cancellation requested.");
  }, []);

  const handleAudioSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setStatus("Unsupported SFX file type. Use wav, mp3, or ogg audio.");
      return;
    }

    try {
      const clip = await createImportedAudioClip(
        file,
        project.animation.currentFrame
      );
      commitProject(
        (currentProject) =>
          syncCinematicTimeline({
            ...currentProject,
            audio: {
              clips: [...currentProject.audio.clips, clip]
            }
          }),
        "Import SFX"
      );
      setStatus(`Imported SFX ${clip.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import SFX.");
    }
  };

  const handleAddBuiltinSfx = useCallback(
    (sfxId: string) => {
      const sfx = getBuiltinSfx(sfxId);
      if (!sfx) return;
      const clip = createBuiltinAudioClip(sfx, project.animation.currentFrame);
      commitProject(
        (currentProject) =>
          syncCinematicTimeline({
            ...currentProject,
            audio: {
              clips: [...currentProject.audio.clips, clip]
            }
          }),
        "Add builtin SFX"
      );
      setStatus(`Added placeholder SFX ${clip.name}.`);
    },
    [commitProject, project.animation.currentFrame]
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

  const handleDuplicateSelectedObject = useCallback(() => {
    if (!selectedObjectId) return;
    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus("Select an object before duplicating.");
      return;
    }
    if (lookup.entity.locked) {
      setStatus(`${lookup.entity.name} is locked.`);
      return;
    }

    const duplicate = structuredClone(lookup.entity) as typeof lookup.entity;
    duplicate.id = createId(duplicate.type);
    duplicate.name = `${duplicate.name} Copy`;
    duplicate.transform.position = [
      duplicate.transform.position[0] + 1,
      duplicate.transform.position[1],
      duplicate.transform.position[2] + 1
    ];
    duplicate.metadata = {
      ...duplicate.metadata,
      duplicatedFrom: lookup.entity.id
    };
    if (duplicate.type === "camera") {
      (duplicate as CameraEntity).active = false;
    }

    commitProject(
      (currentProject) => ({
        ...currentProject,
        scene: {
          ...currentProject.scene,
          [lookup.collection]: [
            ...currentProject.scene[lookup.collection],
            duplicate
          ]
        }
      }),
      "Duplicate object"
    );
    setSelectedObjectId(duplicate.id);
    setSelectedEffectId(null);
    setStatus(`Duplicated ${lookup.entity.name}.`);
  }, [commitProject, project, selectedObjectId]);

  const handleDeleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) return;
    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus("Select an object before deleting.");
      return;
    }
    if (lookup.entity.locked) {
      setStatus(`${lookup.entity.name} is locked.`);
      return;
    }

    commitProject(
      (currentProject) => {
        const nextCollection = currentProject.scene[lookup.collection].filter(
          (entity) => entity.id !== selectedObjectId
        );
        const nextProject = {
          ...currentProject,
          scene: {
            ...currentProject.scene,
            [lookup.collection]: nextCollection
          }
        };
        if (
          lookup.collection === "cameras" &&
          currentProject.activeCameraId === selectedObjectId
        ) {
          const nextCamera = nextProject.scene.cameras[0];
          return {
            ...nextProject,
            activeCameraId: nextCamera?.id ?? "",
            scene: {
              ...nextProject.scene,
              cameras: nextProject.scene.cameras.map((camera, index) => ({
                ...camera,
                active: index === 0
              }))
            }
          };
        }
        return nextProject;
      },
      "Delete object"
    );
    setSelectedObjectId(null);
    setStatus(`Deleted ${lookup.entity.name}.`);
  }, [commitProject, project, selectedObjectId]);

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
        duplicateSelected: handleDuplicateSelectedObject,
        deleteSelected: handleDeleteSelectedObject,
        openSettings: () => setSettingsOpen(true),
        openPluginManager: () => setPluginsOpen(true),
        openExportPanel: () => setExportOpen(true),
        exportCurrentFrame: handleExportCurrentFrame,
        exportPngSequence: handleExportSequence,
        savePackage: handleSaveProject,
        exportLegacyProject: handleExportLegacyProject,
        applySky: (sky) => handleSkyChange(sky, project.sky.customColor),
        togglePlayback: handleTogglePlayback,
        resetViewportCamera: handleResetViewportCamera,
        addKeyframe: handleAddKeyframe,
        addEffect: handleAddEffect,
        toggleRenderPreview: handleToggleRenderPreview,
        toggleCinematicBars: handleToggleCinematicBars,
        applyPostPreset: handleApplyPostPreset,
        undo: handleUndo,
        redo: handleRedo
      }),
    [
      handleAddCamera,
      handleAddCharacter,
      handleAddKeyframe,
      handleImportObj,
      handleDuplicateSelectedObject,
      handleDeleteSelectedObject,
      handleExportCurrentFrame,
      handleExportLegacyProject,
      handleExportSequence,
      handleLoadProject,
      handleNewProject,
      handleRedo,
      handleResetViewportCamera,
      handleSaveProject,
      handleAddEffect,
      handleApplyPostPreset,
      handleToggleCinematicBars,
      handleToggleRenderPreview,
      handleSkyChange,
      handleTogglePlayback,
      handleUndo,
      project.sky.customColor
    ]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";
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
      if ((event.ctrlKey || event.metaKey) && key === "d") {
        event.preventDefault();
        handleDuplicateSelectedObject();
      }
      if (!isTextInput && event.key === "Delete") {
        event.preventDefault();
        if (selectedEffectId) {
          handleDeleteEffect(selectedEffectId);
        } else {
          handleDeleteSelectedObject();
        }
      }
      if (!isTextInput && event.code === "Space") {
        event.preventDefault();
        handleTogglePlayback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleDeleteEffect,
    handleDeleteSelectedObject,
    handleDuplicateSelectedObject,
    handleRedo,
    handleSaveProject,
    handleTogglePlayback,
    handleUndo,
    selectedEffectId
  ]);

  const statusDetails = [
    `Selected: ${selectedObject?.name ?? "none"}`,
    `Frame: ${project.animation.currentFrame}`,
    `FPS: ${project.animation.fps}`,
    isDirty ? "Unsaved" : "Saved",
    `Post: ${project.postProcessing.presetId}`,
    `FX: ${project.effects.instances.length}`,
    `SFX: ${project.audio.clips.length}`,
    `Export: ${project.exportSettings.width}x${project.exportSettings.height}`,
    project.renderSettings.renderPreviewEnabled ? "Render Preview" : "Viewport",
    project.world ? `World: ${project.world.sourceName}` : "World: demo"
  ].join(" | ");

  return (
    <main className="app-shell">
      <TopBar
        projectName={project.projectName}
        isPlaying={project.animation.isPlaying}
        isDirty={isDirty}
        renderPreviewEnabled={project.renderSettings.renderPreviewEnabled}
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
        onOpenExport={() => setExportOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onToggleRenderPreview={handleToggleRenderPreview}
      />
      <div className="workspace">
        <OutlinerPanel
          project={project}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
        />
        <EffectsLibraryPanel
          effects={effectDefinitions}
          selectedEffectId={selectedEffectId}
          effectCount={project.effects.instances.length}
          audioClips={project.audio.clips}
          builtinSfx={BUILTIN_SFX}
          postPresets={POST_PROCESSING_PRESETS}
          activePostPresetId={project.postProcessing.presetId}
          renderSettings={project.renderSettings}
          onAddEffect={handleAddEffect}
          onSelectEffect={handleSelectEffect}
          onApplyPostPreset={handleApplyPostPreset}
          onToggleRenderPreview={handleToggleRenderPreview}
          onToggleCinematicBars={handleToggleCinematicBars}
          onImportAudio={handleImportAudio}
          onAddBuiltinSfx={handleAddBuiltinSfx}
        />
        <Viewport
          project={displayProject}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
          lookThroughCameraRequest={lookThroughCameraRequest}
          resetCameraRequest={resetCameraRequest}
          focusWorldRequest={focusWorldRequest}
          viewportSettings={settings.viewport}
        />
        <InspectorPanel
          project={project}
          selectedObjectId={selectedObjectId}
          selectedEffectId={selectedEffectId}
          onUpdateTransform={handleUpdateTransform}
          onRenameObject={handleRenameObject}
          onToggleVisibility={handleToggleVisibility}
          onToggleLocked={handleToggleLocked}
          onUpdateEffect={handleUpdateEffect}
          onDeleteEffect={handleDeleteEffect}
          onUpdatePostProcessing={handleUpdatePostProcessing}
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
        selectedEffectId={selectedEffectId}
        onSetFrame={handleSetFrame}
        onSetFps={handleSetFps}
        onTogglePlayback={handleTogglePlayback}
        onAddKeyframe={handleAddKeyframe}
        onSelectEffect={handleSelectEffect}
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
      <ExportPanel
        open={exportOpen}
        project={project}
        progress={exportProgress}
        isExporting={
          exportProgress.status === "preparing" ||
          exportProgress.status === "rendering" ||
          exportProgress.status === "encoding"
        }
        onClose={() => setExportOpen(false)}
        onSettingsChange={handleExportSettingsChange}
        onSavePackage={handleSaveProject}
        onExportLegacyProject={handleExportLegacyProject}
        onExportCurrentFrame={handleExportCurrentFrame}
        onExportSequence={handleExportSequence}
        onExportWebM={handleExportWebM}
        onExportWav={handleExportWav}
        onCancelExport={handleCancelExport}
      />
      <WorldImportPanel
        open={worldImportOpen}
        scan={worldScan}
        project={project}
        options={worldImportOptions}
        progress={worldImportProgress}
        isImporting={
          worldImportProgress.status === "scanning" ||
          worldImportProgress.status === "reading-level" ||
          worldImportProgress.status === "reading-regions" ||
          worldImportProgress.status === "reading-chunks" ||
          worldImportProgress.status === "meshing"
        }
        onClose={() => setWorldImportOpen(false)}
        onChooseWorldFolder={handleChooseWorldFolder}
        onOptionsChange={handleWorldImportOptionsChange}
        onImportChunks={handleImportWorldChunks}
        onCancelImport={handleCancelWorldImport}
        onFocusWorld={handleFocusWorld}
        onUnloadWorld={handleUnloadWorld}
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
      <input
        ref={audioInputRef}
        className="hidden-input"
        type="file"
        accept="audio/wav,audio/mpeg,audio/ogg,audio/mp3,.wav,.mp3,.ogg"
        onChange={handleAudioSelected}
      />
    </main>
  );
}

function getViewportShell(): HTMLElement {
  const shell = document.querySelector<HTMLElement>(".viewport-shell");
  if (!shell) {
    throw new Error("Viewport is not mounted.");
  }
  return shell;
}

function downloadExportResult(result: ExportResult): void {
  downloadBlob(result.blob, result.filename);
}

function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
