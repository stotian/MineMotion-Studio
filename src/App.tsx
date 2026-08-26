import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AssetManager } from "./assets/AssetManager";
import { ObjImporter } from "./assets/ObjImporter";
import * as deferredWorkflows from "./workflows/DeferredWorkflowModules";
import { createBuiltinAudioClip, createImportedAudioClip } from "./audio/AudioClip";
import { useProjectAudioPlayback } from "./audio/useProjectAudioPlayback";
import { BUILTIN_SFX, getBuiltinSfx } from "./audio/BuiltinSfxRegistry";
import { addTransformKeyframes, setCurrentFrame } from "./animation/Timeline";
import { createBuiltinCommands } from "./commands/BuiltinCommands";
import {
  applyEffectTimelineCommand,
  type EffectTimelineCommand,
  type EffectTimelineEditablePatch
} from "./effects/EffectTimelineController";
import type { EffectParameters, EffectType } from "./effects/EffectTypes";
import { spawnEffectAtFrame } from "./effects/EffectSpawner";
import { builtinVfxPresetCatalog } from "./vfx/library/BuiltinVfxPresetCatalog";
import {
  createEmptyVfxPackageRegistry,
  loadVfxPackageRegistry,
  type VfxPackageRegistry
} from "./vfx/package/VfxPackageRegistry";
import {
  createInstalledVfxEffect,
  getInstalledVfxSourceStatus,
  listEnabledInstalledVfxPresets
} from "./vfx/package/VfxPackageProjectIntegration";
import { useExportWorkspaceController } from "./export/useExportWorkspaceController";
import { useWorldImportOperations } from "./minecraft/import/useWorldImportOperations";
import type { MinecraftResourceSettings } from "./minecraft/resources/ResourcePackTypes";
import {
  addEnvironmentKeyframe,
  sampleEnvironmentProject
} from "./lighting/LightingController";
import { getLightingMoodPreset } from "./lighting/LightingPresets";
import type {
  LightingMoodPresetId,
  LightingSettings
} from "./lighting/LightingTypes";
import { useExtensionWorkspace } from "./plugins/useExtensionWorkspace";
import { applyCameraPreset } from "./presets/CameraPresets";
import { presetRegistry } from "./presets/PresetRegistry";
import { syncCinematicTimeline } from "./project/CinematicTimeline";
import { applyProductionCameraCut } from "./production/director/ShotRuntime";
import type {
  CameraEntity,
  MineMotionProject,
  ProjectSettings,
  TimelineData,
  TransformData
} from "./project/ProjectFile";
import {
  createCharacter,
  createId,
  createObjEntity,
  createSceneCamera,
  findObject,
  setActiveCamera,
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
import { sampleProjectAnimationWithVfxTiming } from "./vfx/runtime/VfxAnimationSampling";
import { LocalizationProvider } from "./localization/LocalizationContext";
import { createLocalizationService } from "./localization/LocalizationService";
import type { TranslationKey, TranslationValues } from "./localization/LocalizationTypes";
import {
  formatLocalizedDiagnostic,
  type LocalizationDiagnosticCode
} from "./localization/LocalizationDiagnostics";
import type { SkyPresetId } from "./renderer/SkyTypes";
import { MinecraftSkinImporter } from "./rigs/MinecraftSkinImporter";
import { getSelectedCharacterId, parseRigBoneSelection } from "./rigs/RigSelection";
import { useRigWorkspaceController } from "./rigs/RigWorkspaceController";
import { useRigConstraintWorkspace } from "./rigs/useRigConstraintWorkspace";
import { SettingsStore, type AppSettings } from "./settings/AppSettings";
import { useApplicationReliability } from "./reliability/useApplicationReliability";
import { getRuntimeCapabilityRegistry } from "./core/capabilities/CapabilityRegistry";
import { templateRegistry } from "./templates/TemplateRegistry";
import { useProjectWorkspaceController } from "./project/workspace/useProjectWorkspaceController";
import { TopBar } from "./ui/TopBar";
import { WorkspaceFrame } from "./ui/workspaces/WorkspaceFrame";
import { getWorkspaceDefinition } from "./ui/workspaces/WorkspaceRegistry";
import { activateWorkspace, setWorkspacePanelCollapsed, updateWorkspaceLayout } from "./ui/workspaces/WorkspaceLayoutController";
import { useEditorShortcuts } from "./ui/workspaces/useEditorShortcuts";
import { RecoveryDialog } from "./ui/RecoveryDialog";
import { EffectsLibraryPanel } from "./ui/effects/EffectsLibraryPanel";
import { InspectorPanel } from "./ui/inspector/InspectorPanel";
import { OutlinerPanel } from "./ui/outliner/OutlinerPanel";
import { TimelinePanel } from "./ui/timeline/TimelinePanel";
import { WorldGeneratorPanel } from "./ui/world/WorldGeneratorPanel";
import {
  generateWorld,
  type WorldGenSettings
} from "./minecraft/worldgen/WorldGenerator";
import type { ImportedChunkData } from "./minecraft/import/MinecraftChunkTypes";
import type { ImportedWorldSummary } from "./project/ProjectFile";
import {
  installModJar,
  listInstalledMods,
  uninstallMod,
  type InstalledMod
} from "./minecraft/mods/ModLibrary";
import {
  AssetLibraryPanel,
  AudioWorkspacePanel,
  CommandPalette,
  ExportPanel,
  FirstLaunchExperience,
  HelpPanel,
  LightingStudioPanel,
  PluginManagerPanel,
  ProductionWorkspacePanel,
  RigStudioPanel,
  SettingsModal,
  TemplatePicker,
  VfxWorkspacePanel,
  WorldImportPanel
} from "./ui/deferred/DeferredPanelRegistry";

import { ErrorBoundary } from "./reliability/ErrorBoundary";

const Viewport = lazy(() => import("./renderer/Viewport").then(({ Viewport: component }) => ({ default: component })));

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() =>
    SettingsStore.load()
  );
  const localization = useMemo(
    () =>
      createLocalizationService({
        preference: settings.general.language,
        pseudolocalization:
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("locale") === "qps-ploc",
        systemLanguages:
          typeof navigator === "undefined"
            ? []
            : [...(navigator.languages ?? []), navigator.language].filter(Boolean)
      }),
    [settings.general.language]
  );
  const localizationRef = useRef(localization);
  localizationRef.current = localization;
  const tr = useCallback(
    (key: TranslationKey, values: TranslationValues = {}) =>
      localizationRef.current.t(key, values),
    []
  );
  const diagnostic = useCallback(
    (code: LocalizationDiagnosticCode, key: TranslationKey, values: TranslationValues = {}) =>
      formatLocalizedDiagnostic(localizationRef.current, code, key, values),
    []
  );
  const [status, setStatus] = useState(() => localization.t("app.ready"));
  const {
    project,
    projectRef,
    projectInputRef,
    isDirty,
    recoveryCandidate,
    recoveryError,
    replacementVersion,
    setDirty: setIsDirty,
    setProject,
    commitProject,
    replaceProject,
    createNewProject,
    saveProject: handleSaveProject,
    exportLegacyProject: handleExportLegacyProject,
    openProjectPicker: handleLoadProject,
    loadProjectFile,
    undo: handleUndo,
    redo: handleRedo,
    restoreRecovery,
    discardRecovery
  } = useProjectWorkspaceController({
    settings,
    setSettings,
    setStatus,
    tr,
    diagnostic
  });
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    project.scene.characters[0]?.id ?? null
  );
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [lookThroughCameraRequest, setLookThroughCameraRequest] = useState(0);
  const [resetCameraRequest, setResetCameraRequest] = useState(0);
  const [focusWorldRequest, setFocusWorldRequest] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [pluginsOpen, setPluginsOpen] = useState(false);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [rigStudioOpen, setRigStudioOpen] = useState(false);
  const [lightingStudioOpen, setLightingStudioOpen] = useState(false);
  const [worldImportOpen, setWorldImportOpen] = useState(false);
  const [vfxWorkspaceOpen, setVfxWorkspaceOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [vfxPackageRegistry, setVfxPackageRegistry] =
    useState<VfxPackageRegistry>(() => createEmptyVfxPackageRegistry());
  const extensionWorkspace = useExtensionWorkspace({ settings, setSettings, setStatus });

  const worldInputRef = useRef<HTMLInputElement | null>(null);
  const objInputRef = useRef<HTMLInputElement | null>(null);
  const skinInputRef = useRef<HTMLInputElement | null>(null);
  const skinTargetCharacterIdRef = useRef<string | null>(null);
  const blockbenchInputRef = useRef<HTMLInputElement | null>(null);
  const resourcePackZipInputRef = useRef<HTMLInputElement | null>(null);
  const resourcePackFolderInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const lastPlaybackTimeRef = useRef<number | null>(null);
  const playbackEndFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    void loadVfxPackageRegistry(window.localStorage).then((loaded) => {
      if (cancelled) return;
      setVfxPackageRegistry(loaded.registry);
      if (loaded.warnings.length > 0) {
        setStatus(diagnostic("VFX_PACKAGE_REGISTRY_WARNING", "app.vfxRegistryWarnings", {
          count: loaded.warnings.length
        }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const presets = useMemo(() => presetRegistry.snapshot(), [extensionWorkspace.registryRevision]);
  const rigPosePresets = useMemo(
    () => [...presets.rigPose, ...project.rigs.savedPoses],
    [presets.rigPose, project.rigs.savedPoses]
  );
  const templates = useMemo(() => templateRegistry.list(), [extensionWorkspace.registryRevision]);
  const effectPresets = useMemo(() => builtinVfxPresetCatalog.list(), []);
  const selectedObject = useMemo(
    () => findObject(project, selectedObjectId)?.entity ?? null,
    [project, selectedObjectId]
  );
  useEffect(() => {
    if (
      selectedEffectId &&
      !project.effects.instances.some((effect) => effect.id === selectedEffectId)
    ) {
      setSelectedEffectId(null);
    }
  }, [project.effects.instances, selectedEffectId]);

  const animatedProject = useMemo(() => {
    const timelineFrame = project.animation.currentFrame;
    const sampled = sampleProjectAnimationWithVfxTiming(project, timelineFrame);
    const directed = project.animation.isPlaying || project.renderSettings.renderPreviewEnabled
      ? applyProductionCameraCut(sampled, timelineFrame)
      : sampled;
    return sampleEnvironmentProject(
      {
        ...directed,
        animation: { ...directed.animation, currentFrame: timelineFrame }
      },
      timelineFrame
    );
  }, [project]);
  const rigConstraints = useRigConstraintWorkspace(
    project,
    selectedObjectId,
    animatedProject
  );
  const displayProject = rigConstraints.displayProject;
  const reliability = useApplicationReliability({ settings, project, setSettings, setStatus });

  useProjectAudioPlayback(project);

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
        const playbackEnd = playbackEndFrameRef.current ?? currentProject.animation.durationFrames;
        const reachedEnd = nextFrame >= playbackEnd;
        if (reachedEnd) playbackEndFrameRef.current = null;

        return {
          ...currentProject,
          animation: {
            ...currentProject.animation,
            currentFrame: reachedEnd
              ? playbackEnd
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

  const requestWorldFocus = useCallback(() => setFocusWorldRequest((value) => value + 1), []);
  const {
    scan: worldScan,
    importOptions: worldImportOptions,
    progress: worldImportProgress,
    isImporting: isWorldImporting,
    selectWorld: handleWorldSelected,
    updateOptions: handleWorldImportOptionsChange,
    importChunks: handleImportWorldChunks,
    reimportChangedChunks: handleReimportChangedWorldChunks,
    unloadSelectedChunks: handleUnloadSelectedWorldChunks,
    hideSelectedChunks: handleHideSelectedWorldChunks,
    showAllChunks: handleShowAllWorldChunks,
    addSceneMarker: handleAddWorldSceneMarker,
    addSceneProp: handleAddWorldSceneProp,
    removeSceneItem: handleRemoveWorldSceneItem,
    saveImportProfile: handleSaveWorldImportProfile,
    applyImportProfile: handleApplyWorldImportProfile,
    deleteImportProfile: handleDeleteWorldImportProfile,
    cancel: handleCancelWorldImport,
    reset: resetWorldImport
  } = useWorldImportOperations({
    project,
    commitProject,
    setProject,
    setDirty: setIsDirty,
    setSelectedObjectId,
    requestWorldFocus,
    setPanelOpen: setWorldImportOpen,
    setStatus,
    tr,
    diagnostic
  });
  const {
    progress: exportProgress,
    isExporting,
    ffmpegDetection,
    updateSettings: handleExportSettingsChange,
    updateFfmpegSettings: handleFfmpegSettingsChange,
    detectFfmpeg: handleDetectFfmpeg,
    addRenderJob: handleAddRenderJob,
    runRenderJob: handleRunRenderJob,
    removeRenderJob: handleRemoveRenderJob,
    clearFinishedRenderJobs: handleClearFinishedRenderJobs,
    exportCurrentFrame: handleExportCurrentFrame,
    exportSequence: handleExportSequence,
    exportWebM: handleExportWebM,
    exportWav: handleExportWav,
    cancel: handleCancelExport
  } = useExportWorkspaceController({
    project,
    localization,
    setProject,
    setDirty: setIsDirty,
    setStatus,
    tr,
    diagnostic
  });
  const rigWorkspace = useRigWorkspaceController({
    project,
    selectedObjectId,
    ikSession: rigConstraints.ikSession,
    lookAtSession: rigConstraints.lookAtSession,
    commitProject,
    setStatus,
    tr
  });
  const workspaceLayout = settings.editor.workspace;
  const workspaceDefinition = getWorkspaceDefinition(workspaceLayout.activeWorkspace);
  const timelineVisible = workspaceDefinition.visiblePanels.includes("timeline") &&
    !workspaceLayout.collapsedPanels.includes("timeline");
  const capabilityWarnings = useMemo(() =>
    getRuntimeCapabilityRegistry().list().filter((capability) => capability.status === "unavailable").length,
  [ffmpegDetection.available]);

  useEffect(() => {
    setSelectedObjectId(
      project.scene.characters[0]?.id ?? project.scene.cameras[0]?.id ?? null
    );
    setSelectedEffectId(null);
  }, [replacementVersion]);

  const handleSelectObject = useCallback((objectId: string | null) => {
    setSelectedObjectId(objectId);
    setSelectedEffectId(null);
  }, []);

  const handleSelectEffect = useCallback((effectId: string) => {
    setSelectedEffectId(effectId);
    setSelectedObjectId(null);
  }, []);

  const handleNewProject = useCallback(() => {
    createNewProject(() => resetWorldImport("Project replaced."));
  }, [createNewProject, resetWorldImport]);

  const handleNewProjectFromTemplate = useCallback(
    (templateId: string) => {
      const nextProject = templateRegistry.createProject(templateId, settings);
      const replaced = replaceProject(
        nextProject,
        tr("app.templateLoaded", { name: nextProject.projectName }),
        {
          beforeReplace: () => resetWorldImport("Project replaced."),
          dirty: true
        }
      );
      if (replaced) setTemplatesOpen(false);
    },
    [replaceProject, resetWorldImport, settings, tr]
  );

  const handleProjectFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      await loadProjectFile(file, () => resetWorldImport("Project replaced."));
    },
    [loadProjectFile, resetWorldImport]
  );

  const handleOpenWorld = useCallback(() => {
    setWorldImportOpen(true);
    worldInputRef.current?.click();
  }, []);

  const handleChooseWorldFolder = useCallback(() => {
    worldInputRef.current?.click();
  }, []);

  const handleFocusWorld = useCallback(() => {
    requestWorldFocus();
    setStatus(tr("app.worldFocused"));
  }, [requestWorldFocus]);

  const handleUnloadWorld = useCallback(() => {
    resetWorldImport("World unloaded.");
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
    setSelectedObjectId(null);
    setStatus(tr("app.worldUnloaded"));
  }, [commitProject, resetWorldImport]);

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
    setStatus(tr("app.addedEntity", { name: character.name }));
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
    setStatus(tr("app.addedEntity", { name: camera.name }));
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
          ? tr("app.objImportedWarnings", { name: imported.name, count: imported.warnings.length })
          : tr("app.objImported", { name: imported.name })
      );
    } catch (error) {
      setStatus(diagnostic("OBJ_IMPORT_FAILED", "app.objFailed"));
    }
  };

  const handleImportSkin = useCallback((characterId: string) => {
    skinTargetCharacterIdRef.current = characterId;
    skinInputRef.current?.click();
  }, []);

  const handleSkinSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const targetCharacterId =
      skinTargetCharacterIdRef.current ?? getSelectedCharacterId(selectedObjectId);
    skinTargetCharacterIdRef.current = null;
    if (!targetCharacterId) {
      setStatus(tr("app.selectCharacterSkin"));
      return;
    }

    try {
      const skin = await MinecraftSkinImporter.fromFile(file);
      commitProject(
        (currentProject) => {
          const withSkinAsset = AssetManager.addSkinAsset(currentProject, skin);
          return {
            ...withSkinAsset,
            scene: {
              ...withSkinAsset.scene,
              characters: withSkinAsset.scene.characters.map((character) =>
                character.id === targetCharacterId
                  ? {
                      ...character,
                      skin,
                      modelType:
                        skin.metadata.modelType === "unknown"
                          ? character.modelType
                          : skin.metadata.modelType
                    }
                  : character
              )
            }
          };
        },
        "Import Minecraft skin"
      );
      setSelectedObjectId(targetCharacterId);
      setStatus(
        skin.metadata.valid
          ? tr("app.skinImported", { name: skin.name, width: skin.metadata.width, height: skin.metadata.height, model: skin.metadata.modelType })
          : tr("app.skinInvalid", { name: skin.name })
      );
    } catch (error) {
      setStatus(diagnostic("SKIN_IMPORT_FAILED", "app.skinFailed"));
    }
  };

  const handleResetSkin = useCallback(
    (characterId: string) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          scene: {
            ...currentProject.scene,
            characters: currentProject.scene.characters.map((character) =>
              character.id === characterId ? { ...character, skin: null } : character
            )
          }
        }),
        "Reset character skin"
      );
      setStatus(tr("app.skinReset"));
    },
    [commitProject]
  );

  const handleImportBlockbench = useCallback(() => {
    blockbenchInputRef.current?.click();
  }, []);
  const handleBlockbenchSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const { BlockbenchImporter } =
        await deferredWorkflows.loadBlockbenchImporter();
      const imported = await BlockbenchImporter.fromFile(file);
      let createdObjectId = "";
      commitProject(
        (currentProject) => {
          const withBlockbenchAsset = AssetManager.addBlockbenchAsset(
            currentProject,
            imported.asset
          );
          const { project: withObjAsset, asset } = AssetManager.addObjAsset(
            withBlockbenchAsset,
            imported.asset.name,
            imported.rawObj
          );
          const entity = createObjEntity(asset.id, imported.asset.name);
          createdObjectId = entity.id;
          return {
            ...withObjAsset,
            scene: {
              ...withObjAsset.scene,
              importedObjects: [...withObjAsset.scene.importedObjects, entity]
            }
          };
        },
        "Import Blockbench model"
      );
      setSelectedObjectId(createdObjectId);
      setRigStudioOpen(true);
      setStatus(
        tr("app.blockbenchImported", { name: imported.asset.name, cubes: imported.asset.elementCount, groups: imported.asset.groupCount })
      );
    } catch (error) {
      setStatus(diagnostic("BLOCKBENCH_IMPORT_FAILED", "app.blockbenchFailed"));
    }
  };

  const handleUpdateTransform = useCallback(
    (objectId: string, transform: TransformData) => {
      const lookup = findObject(project, objectId);
      if (lookup?.entity.locked) {
        setStatus(tr("app.entityLocked", { name: lookup.entity.name }));
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
    (
      type: EffectType,
      // Library variants are the same effect with tuned parameters, so they
      // spawn through this same path with overrides applied.
      overrides?: { parameters?: EffectParameters; durationFrames?: number }
    ) => {
      const currentProject = projectRef.current;
      const startFrame = currentProject.animation.currentFrame;
      const remainingFrames =
        currentProject.animation.durationFrames - startFrame;
      if (remainingFrames < 1) {
        setStatus(tr("app.effectFinalFrame"));
        return;
      }
      const spawnedEffect = spawnEffectAtFrame(
        type,
        startFrame,
        selectedObjectId ?? ""
      );
      const requestedDuration =
        overrides?.durationFrames ?? spawnedEffect.durationFrames;
      const effect = {
        ...spawnedEffect,
        parameters: {
          ...spawnedEffect.parameters,
          ...(overrides?.parameters ?? {})
        },
        durationFrames: Math.min(requestedDuration, remainingFrames)
      };
      const result = applyEffectTimelineCommand(projectRef.current, {
        type: "insert",
        effect
      });
      if (!result.ok) {
        setStatus(diagnostic("EFFECT_ADD_FAILED", "app.effectAddFailed"));
        return;
      }
      if (result.value.changed) {
        commitProject(result.value.project, result.value.historyLabel);
      }
      setSelectedEffectId(result.value.selectedEffectId);
      setSelectedObjectId(null);
      setStatus(tr("app.effectAdded", { name: effect.name, frame: effect.startFrame }));
    },
    [commitProject, selectedObjectId]
  );

  const handleAddCustomEffect = useCallback(
    (packageId: string) => {
      const entry = vfxPackageRegistry.packages.find(
        (candidate) => candidate.id === packageId && candidate.enabled
      );
      if (!entry) {
        setStatus(tr("app.customVfxUnavailable", { id: packageId }));
        return;
      }
      const currentProject = projectRef.current;
      const startFrame = currentProject.animation.currentFrame;
      const remainingFrames = currentProject.animation.durationFrames - startFrame;
      if (remainingFrames < 1) {
        setStatus(tr("app.effectFinalFrame"));
        return;
      }
      try {
        const created = createInstalledVfxEffect(entry, {
          id: createId("effect"),
          startFrame,
          targetObjectId: selectedObjectId ?? undefined
        });
        const effect = {
          ...created,
          durationFrames: Math.min(created.durationFrames, remainingFrames)
        };
        const result = applyEffectTimelineCommand(currentProject, {
          type: "insert",
          effect
        });
        if (!result.ok) {
          setStatus(diagnostic("VFX_ADD_FAILED", "app.customVfxAddFailed"));
          return;
        }
        if (result.value.changed) commitProject(result.value.project, result.value.historyLabel);
        setSelectedEffectId(result.value.selectedEffectId);
        setSelectedObjectId(null);
        setStatus(tr("app.customVfxAdded", { name: effect.name, frame: effect.startFrame }));
      } catch (error) {
        setStatus(diagnostic("VFX_ADD_FAILED", "app.customVfxAddFailed"));
      }
    },
    [commitProject, selectedObjectId, vfxPackageRegistry]
  );

  const customVfxPresets = useMemo(
    () => listEnabledInstalledVfxPresets(vfxPackageRegistry, localization.language),
    [localization.language, vfxPackageRegistry]
  );

  const handleEffectTimelineCommand = useCallback(
    (command: EffectTimelineCommand) => {
      const result = applyEffectTimelineCommand(projectRef.current, command);
      if (!result.ok) {
        const message = diagnostic("EFFECT_EDIT_FAILED", "app.effectEditFailed");
        setStatus(message);
        return message;
      }
      if (!result.value.changed) {
        setStatus(tr("app.effectUnchanged"));
        return null;
      }

      commitProject(result.value.project, result.value.historyLabel);
      setSelectedEffectId(result.value.selectedEffectId);
      if (result.value.selectedEffectId) setSelectedObjectId(null);
      setStatus(`${result.value.historyLabel}.`);
      return null;
    },
    [commitProject]
  );

  const handleUpdateEffect = useCallback(
    (effectId: string, patch: EffectTimelineEditablePatch) => {
      return handleEffectTimelineCommand({ type: "update", effectId, patch });
    },
    [handleEffectTimelineCommand]
  );

  const handleDeleteEffect = useCallback(
    (effectId: string) => {
      handleEffectTimelineCommand({ type: "delete", effectId });
    },
    [handleEffectTimelineCommand]
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
      setStatus(tr("app.postPreset", { name: preset.name }));
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
      setStatus(tr("app.postUpdated"));
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
    setStatus(tr("app.previewToggled"));
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
    setStatus(tr("app.barsToggled"));
  }, [commitProject]);

  const handleAudioSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setStatus(tr("app.sfxUnsupported"));
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
              ...currentProject.audio,
              clips: [...currentProject.audio.clips, clip]
            }
          }),
        "Import SFX"
      );
      setStatus(tr("app.sfxImported", { name: clip.name }));
    } catch (error) {
      setStatus(diagnostic("AUDIO_IMPORT_FAILED", "app.sfxFailed"));
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
              ...currentProject.audio,
              clips: [...currentProject.audio.clips, clip]
            }
          }),
        "Add builtin SFX"
      );
      setStatus(tr("app.sfxAdded", { name: clip.name }));
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
      setStatus(tr("app.selectDuplicate"));
      return;
    }
    if (lookup.entity.locked) {
      setStatus(tr("app.entityLocked", { name: lookup.entity.name }));
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
    setStatus(tr("app.duplicated", { name: lookup.entity.name }));
  }, [commitProject, project, selectedObjectId]);

  const handleDeleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) return;
    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus(tr("app.selectDelete"));
      return;
    }
    if (lookup.entity.locked) {
      setStatus(tr("app.entityLocked", { name: lookup.entity.name }));
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
    setStatus(tr("app.deleted", { name: lookup.entity.name }));
  }, [commitProject, project, selectedObjectId]);

  const [worldGenOpen, setWorldGenOpen] = useState(false);
  const [worldGenProgress, setWorldGenProgress] = useState<{ completed: number; total: number } | null>(null);
  const [isGeneratingWorld, setIsGeneratingWorld] = useState(false);

  /*
   * Generation runs in slices across animation frames rather than one blocking
   * pass: a radius of 8 is 289 chunks, which would freeze the window for
   * seconds. Chunks arrive nearest-first, so the centre appears immediately.
   */
  const handleGenerateWorld = useCallback((settings: WorldGenSettings) => {
    setIsGeneratingWorld(true);
    const iterator = generateWorld(settings);
    const chunks: ImportedChunkData[] = [];
    const SLICE_MS = 12;

    const step = () => {
      const sliceStart = performance.now();
      let done = false;
      while (performance.now() - sliceStart < SLICE_MS) {
        const next = iterator.next();
        if (next.done) { done = true; break; }
        chunks.push(next.value.chunk);
        setWorldGenProgress({ completed: next.value.completed, total: next.value.total });
      }
      if (!done) {
        requestAnimationFrame(step);
        return;
      }
      const world: ImportedWorldSummary = {
        sourceName: tr("worldgen.generatedName", { seed: settings.seed }),
        levelDatFound: false,
        dimensions: [],
        selectedDimension: "overworld",
        importedChunks: chunks,
        importedAt: new Date().toISOString(),
        notes: [tr("worldgen.generatedNote", { seed: settings.seed })]
      };
      commitProject(
        (current) => ({
          ...current,
          world,
          projectSettings: { ...current.projectSettings, terrainPreset: "none" as const }
        }),
        "Generate world"
      );
      setIsGeneratingWorld(false);
      setWorldGenProgress(null);
      setWorldGenOpen(false);
      setStatus(tr("worldgen.done", { chunks: chunks.length }));
    };
    requestAnimationFrame(step);
  }, [commitProject, tr]);

  const [installedMods, setInstalledMods] = useState<InstalledMod[]>([]);

  /*
   * One install button for both kinds of file. A .jar is a Minecraft mod and
   * goes to the block registry; anything else is a BlockMotion plugin and goes
   * to the extension loader. Asking the user to pick the right button first
   * would be a worse experience for no benefit — the extension already says
   * which it is.
   */
  const handleInstallFile = useCallback(async (file: File) => {
    if (file.name.toLowerCase().endsWith(".jar")) {
      const record = await installModJar(await file.arrayBuffer());
      setInstalledMods(listInstalledMods());
      setStatus(
        tr("mods.installed", {
          name: record.metadata.name,
          blocks: record.blockCount,
          loader: record.metadata.loader
        })
      );
      return;
    }
    await extensionWorkspace.installFile(file);
  }, [extensionWorkspace, tr]);

  const handleUninstallMod = useCallback((modId: string) => {
    if (!uninstallMod(modId)) return;
    setInstalledMods(listInstalledMods());
    setStatus(tr("mods.uninstalled", { id: modId }));
  }, [tr]);

  const handleAddKeyframe = useCallback(() => {
    const boneSelection = parseRigBoneSelection(selectedObjectId);
    if (boneSelection) {
      rigWorkspace.addBoneKeyframe(boneSelection.characterId, boneSelection.boneId);
      return;
    }

    if (!selectedObjectId || selectedObjectId === "world") {
      setStatus(tr("app.selectKeyframe"));
      return;
    }

    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus(tr("app.notKeyframeable"));
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
      tr("app.transformKey", { name: lookup.entity.name, frame: project.animation.currentFrame })
    );
  }, [commitProject, project, rigWorkspace.addBoneKeyframe, selectedObjectId]);

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
      setStatus(tr("app.skyChanged", { preset }));
    },
    [commitProject]
  );

  const handleApplyLightingMood = useCallback(
    (presetId: LightingMoodPresetId) => {
      const preset = getLightingMoodPreset(presetId);
      const postPreset = getPostProcessingPreset(preset.postPresetId);
      commitProject(
        (currentProject) => ({
          ...currentProject,
          projectSettings: {
            ...currentProject.projectSettings,
            defaultSkyPreset: preset.skyPresetId
          },
          sky: {
            ...currentProject.sky,
            preset: preset.skyPresetId
          },
          lighting: {
            ...preset.settings,
            sunDirection: [...preset.settings.sunDirection],
            moonDirection: [...preset.settings.moonDirection],
            windDirection: [...preset.settings.windDirection],
            keyframes: currentProject.lighting.keyframes
          },
          postProcessing: {
            ...postPreset.settings
          }
        }),
        "Apply lighting mood"
      );
      setStatus(tr("app.lightingMood", { name: preset.name }));
    },
    [commitProject]
  );

  const handleUpdateLighting = useCallback(
    (patch: Partial<LightingSettings>) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          lighting: {
            ...currentProject.lighting,
            ...patch
          }
        }),
        "Edit lighting"
      );
      setStatus(tr("app.lightingUpdated"));
    },
    [commitProject]
  );

  const handleUpdateMinecraftResources = useCallback(
    (minecraftResources: MinecraftResourceSettings) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          minecraftResources
        }),
        "Edit Minecraft materials"
      );
      setStatus(tr("app.materialsUpdated"));
    },
    [commitProject]
  );

  const handleChooseResourcePackZip = useCallback(() => {
    resourcePackZipInputRef.current?.click();
  }, []);

  const handleChooseResourcePackFolder = useCallback(() => {
    resourcePackFolderInputRef.current?.click();
  }, []);

  const handleResourcePackZipSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const { ResourcePackImporter } =
        await deferredWorkflows.loadResourcePackImporter();
      const pack = await ResourcePackImporter.importZip(file);
      commitProject(
        (currentProject) => ({
          ...currentProject,
          assets: {
            ...currentProject.assets,
            resourcePacks: [...currentProject.assets.resourcePacks, pack]
          },
          minecraftResources: {
            ...currentProject.minecraftResources,
            activeResourcePackId: pack.id
          }
        }),
        "Import resource pack ZIP"
      );
      setLightingStudioOpen(true);
      setStatus(
        tr("app.resourcePackImported", { name: pack.name, count: pack.textures.length })
      );
    } catch (error) {
      setStatus(diagnostic("RESOURCE_PACK_ZIP_FAILED", "app.resourceZipFailed"));
    }
  };

  const handleResourcePackFolderSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;
    try {
      const { ResourcePackImporter } =
        await deferredWorkflows.loadResourcePackImporter();
      const pack = await ResourcePackImporter.importFolder(files);
      commitProject(
        (currentProject) => ({
          ...currentProject,
          assets: {
            ...currentProject.assets,
            resourcePacks: [...currentProject.assets.resourcePacks, pack]
          },
          minecraftResources: {
            ...currentProject.minecraftResources,
            activeResourcePackId: pack.id
          }
        }),
        "Import resource pack folder"
      );
      setLightingStudioOpen(true);
      setStatus(
        tr("app.resourcePackImported", { name: pack.name, count: pack.textures.length })
      );
    } catch (error) {
      setStatus(diagnostic("RESOURCE_PACK_FOLDER_FAILED", "app.resourceFolderFailed"));
    }
  };

  const handleSetActiveResourcePack = useCallback(
    (packId: string | null) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          minecraftResources: {
            ...currentProject.minecraftResources,
            activeResourcePackId: packId
          }
        }),
        "Change active resource pack"
      );
      setStatus(tr(packId ? "app.resourceApplied" : "app.resourceReset"));
    },
    [commitProject]
  );

  const handleRemoveResourcePack = useCallback(
    (packId: string) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          assets: {
            ...currentProject.assets,
            resourcePacks: currentProject.assets.resourcePacks.filter(
              (pack) => pack.id !== packId
            )
          },
          minecraftResources: {
            ...currentProject.minecraftResources,
            activeResourcePackId:
              currentProject.minecraftResources.activeResourcePackId === packId
                ? null
                : currentProject.minecraftResources.activeResourcePackId
          }
        }),
        "Remove resource pack"
      );
      setStatus(tr("app.resourceRemoved"));
    },
    [commitProject]
  );

  const handleAddEnvironmentKeyframe = useCallback(() => {
    commitProject(
      (currentProject) =>
        syncCinematicTimeline({
          ...currentProject,
          lighting: addEnvironmentKeyframe(
            currentProject.lighting,
            currentProject.postProcessing,
            currentProject.animation.currentFrame
          )
        }),
      "Add environment keyframe"
    );
    setStatus(
      tr("app.environmentKey", { frame: project.animation.currentFrame })
    );
  }, [commitProject, project.animation.currentFrame]);

  const handleProjectSettingsChange = useCallback(
    (projectSettings: ProjectSettings) => {
      commitProject(
        (currentProject) => updateProjectSettings(currentProject, projectSettings),
        "Change project settings"
      );
      setStatus(tr("app.projectSettingsUpdated"));
    },
    [commitProject]
  );

  const handleSetFrame = useCallback((frame: number) => {
    playbackEndFrameRef.current = null;
    setProject((currentProject) => ({
      ...currentProject,
      animation: setCurrentFrame(currentProject.animation, frame)
    }));
  }, []);

  const handlePreviewFrames = useCallback((startFrame: number, endFrame: number) => {
    playbackEndFrameRef.current = Math.max(startFrame, endFrame);
    lastPlaybackTimeRef.current = null;
    setProject((currentProject) => ({ ...currentProject, animation: { ...setCurrentFrame(currentProject.animation, startFrame), isPlaying: true } }));
  }, []);

  const handleUpdateAnimation = useCallback(
    (animation: TimelineData, label: string) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          animation
        }),
        label
      );
      setStatus(`${label}.`);
    },
    [commitProject]
  );

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
    playbackEndFrameRef.current = null;
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
      setStatus(tr("app.selectCamera"));
      return;
    }
    setLookThroughCameraRequest((value) => value + 1);
    setStatus(tr("app.cameraMoved"));
  }, [project, selectedObjectId]);

  const handleResetViewportCamera = useCallback(() => {
    setResetCameraRequest((value) => value + 1);
    setStatus(tr("app.cameraReset"));
  }, []);

  const handleSetActiveCamera = useCallback((cameraId: string) => {
    commitProject((currentProject) => setActiveCamera(currentProject, cameraId), "Set active camera");
    setStatus(tr("app.activeCameraChanged"));
  }, [commitProject]);

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
      setStatus(tr("app.cameraPreset", { name: preset.name }));
    },
    [commitProject, selectedObjectId]
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
      }, localization),
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
      localization,
      project.sky.customColor
    ]
  );

  useEditorShortcuts(useMemo(() => ({
    projectRef,
    selectedEffectId,
    openCommandPalette: () => setCommandsOpen(true),
    saveProject: handleSaveProject,
    undo: handleUndo,
    redo: handleRedo,
    duplicateObject: handleDuplicateSelectedObject,
    deleteObject: handleDeleteSelectedObject,
    deleteEffect: handleDeleteEffect,
    editEffect: handleEffectTimelineCommand,
    togglePlayback: handleTogglePlayback
  }), [projectRef, selectedEffectId, handleSaveProject, handleUndo, handleRedo,
    handleDuplicateSelectedObject, handleDeleteSelectedObject, handleDeleteEffect,
    handleEffectTimelineCommand, handleTogglePlayback]));

  // Blender's status bar counts what is in the scene; this mirrors that.
  const sceneObjectCount =
    project.scene.characters.length +
    project.scene.cameras.length +
    project.scene.lights.length +
    project.scene.importedObjects.length;

  const statusDetails = [
    localization.t("status.selected", { name: selectedObjectLabel(
      project,
      selectedObjectId,
      selectedObject?.name,
      localization.t("status.character"),
      localization.t("common.none")
    ) }),
    localization.t("status.frame", { frame: localization.formatNumber(project.animation.currentFrame) }),
    localization.t("status.fps", { fps: localization.formatNumber(project.animation.fps) }),
    localization.t(isDirty ? "status.unsaved" : "status.saved"),
    localization.t("status.post", { preset: project.postProcessing.presetId }),
    localization.t("status.lighting", { preset: project.lighting.presetId }),
    localization.t("status.effects", { count: localization.formatNumber(project.effects.instances.length) }),
    localization.t("status.audio", { count: localization.formatNumber(project.audio.clips.length) }),
    localization.t("status.export", { width: project.exportSettings.width, height: project.exportSettings.height }),
    localization.t(project.renderSettings.renderPreviewEnabled ? "status.renderPreview" : "status.viewport"),
    project.world
      ? localization.t("status.world", { name: project.world.sourceName })
      : localization.t("status.worldDemo")
  ].join(" | ");

  return (
    <LocalizationProvider service={localization}>
      <FirstLaunchExperience templates={templates} recentProjects={settings.general.recentProjects} recoveryAvailable={Boolean(recoveryCandidate)} onCreateTemplate={handleNewProjectFromTemplate} onOpenProject={handleLoadProject} onOpenTemplates={() => setTemplatesOpen(true)} onRestoreRecovery={restoreRecovery} onOpenHelp={() => setHelpOpen(true)} />
      <RecoveryDialog
        candidate={recoveryCandidate}
        error={recoveryError}
        onRestore={restoreRecovery}
        onDiscard={discardRecovery}
      />
    <main
      className={`app-shell workspace-density-${workspaceLayout.density}`}
      lang={localization.language}
      style={{ "--workspace-timeline-height": timelineVisible ? `${workspaceLayout.timelineHeight}px` : "0px" } as CSSProperties}
    >
      <TopBar
        projectName={project.projectName}
        isDirty={isDirty}
        autosaveEnabled={settings.general.autosaveEnabled}
        exporting={isExporting}
        capabilityWarnings={capabilityWarnings}
        workspaceId={workspaceLayout.activeWorkspace}
        onWorkspaceChange={(workspace) => setSettings((current) => activateWorkspace(current, workspace))}
        renderPreviewEnabled={project.renderSettings.renderPreviewEnabled}
        onNewProject={handleNewProject}
        onNewProjectFromTemplate={() => setTemplatesOpen(true)}
        onOpenWorld={handleOpenWorld}
        onGenerateWorld={() => setWorldGenOpen(true)}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onAddCharacter={handleAddCharacter}
        onAddCamera={handleAddCamera}
        onImportObj={handleImportObj}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAssets={() => setAssetsOpen(true)}
        onOpenAudio={() => setAudioOpen(true)}
        onOpenPlugins={() => setPluginsOpen(true)}
        onOpenCommands={() => setCommandsOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onOpenRigStudio={() => setRigStudioOpen(true)}
        onOpenLightingStudio={() => setLightingStudioOpen(true)}
        onOpenVfxWorkspace={() => setVfxWorkspaceOpen(true)}
        onOpenProduction={() => setProductionOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onToggleRenderPreview={handleToggleRenderPreview}
      />
      <WorkspaceFrame
        layout={workspaceLayout}
        onLayoutChange={(patch) => setSettings((current) => updateWorkspaceLayout(current, patch))}
        onPanelCollapsedChange={(panel, collapsed) =>
          setSettings((current) => setWorkspacePanelCollapsed(current, panel, collapsed))
        }
      >
        <OutlinerPanel
          project={project}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
          onToggleVisibility={handleToggleVisibility}
          onToggleLocked={handleToggleLocked}
          onSetActiveCamera={handleSetActiveCamera}
        />
        <EffectsLibraryPanel
          presets={effectPresets}
          customPresets={customVfxPresets}
          selectedEffectId={selectedEffectId}
          effectInstances={project.effects.instances}
          audioClips={project.audio.clips}
          builtinSfx={BUILTIN_SFX}
          postPresets={POST_PROCESSING_PRESETS}
          activePostPresetId={project.postProcessing.presetId}
          renderSettings={project.renderSettings}
          onAddEffect={handleAddEffect}
          onAddCustomEffect={handleAddCustomEffect}
          getCustomSourceStatus={(effect) =>
            getInstalledVfxSourceStatus(effect, vfxPackageRegistry)
          }
          onSelectEffect={handleSelectEffect}
          onApplyPostPreset={handleApplyPostPreset}
          onToggleRenderPreview={handleToggleRenderPreview}
          onToggleCinematicBars={handleToggleCinematicBars}
          onImportAudio={handleImportAudio}
          onAddBuiltinSfx={handleAddBuiltinSfx}
        />
        <ErrorBoundary
          context="3D viewport"
          fallback={(error) => (
            <div className="viewport-loading" role="alert">
              <span>{localization.t("app.viewportError")}</span>
              <pre className="viewport-error-detail">{error.message}</pre>
            </div>
          )}
        >
        <Suspense fallback={<div className="viewport-loading" aria-live="polite">{localization.t("app.viewportLoading")}</div>}>
        <Viewport
          project={displayProject}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
          lookThroughCameraRequest={lookThroughCameraRequest}
          resetCameraRequest={resetCameraRequest}
          focusWorldRequest={focusWorldRequest}
          viewportSettings={settings.viewport}
          motionPath={rigConstraints.motionPathSession.path}
          onTransformObject={handleUpdateTransform}
          onRotateBone={rigWorkspace.updateBoneRotation}
          onAddKeyframe={handleAddKeyframe}
        />
        </Suspense>
        </ErrorBoundary>
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
          rigPosePresets={rigPosePresets}
          animationPresets={presets.animation}
          onApplyCameraPreset={handleApplyCameraPreset}
          onApplyRigPosePreset={rigWorkspace.applyPose}
          onApplyAnimationPreset={rigWorkspace.applyAnimation}
          onUpdateBoneRotation={rigWorkspace.updateBoneRotation}
          onAddBoneKeyframe={rigWorkspace.addBoneKeyframe}
          onResetPose={rigWorkspace.resetPose}
          onMirrorPose={rigWorkspace.mirrorPose}
          onImportSkin={handleImportSkin}
          onResetSkin={handleResetSkin}
          onChangeRigPreset={rigWorkspace.changeRigPreset}
          workspaceTab={workspaceDefinition.propertiesTab}
        />
      </WorkspaceFrame>
      <div className="workspace-timeline-slot" hidden={!timelineVisible}>
      <TimelinePanel
        project={project}
        selectedObjectId={selectedObjectId}
        selectedEffectId={selectedEffectId}
        onSetFrame={handleSetFrame}
        onSetFps={handleSetFps}
        onTogglePlayback={handleTogglePlayback}
        onAddKeyframe={handleAddKeyframe}
        onSelectEffect={handleSelectEffect}
        onEditEffectTimeline={handleEffectTimelineCommand}
        onUpdateAnimation={handleUpdateAnimation}
        workspaceView={workspaceDefinition.timelineView}
      />
      </div>
      {/*
        Blender's status bar: mouse-button hints on the left, scene statistics
        on the right. The app's own status message takes the middle, where
        Blender shows progress reports.
      */}
      <div className="status-bar" role="status" aria-live="polite" aria-atomic="true">
        <span className="status-hints" aria-hidden="true">
          <span className="status-hint"><b>LMB</b> {tr("status.hint.select")}</span>
          <span className="status-hint"><b>MMB</b> {tr("status.hint.orbit")}</span>
          <span className="status-hint"><b>RMB</b> {tr("status.hint.context")}</span>
        </span>
        <span className="status-message">{status}</span>
        <span className="status-stats">
          <span>{tr("status.stats.objects", { count: sceneObjectCount })}</span>
          <span>{tr("status.stats.frame", {
            frame: project.animation.currentFrame,
            total: project.animation.durationFrames
          })}</span>
          <strong>{statusDetails}</strong>
        </span>
      </div>
      <AudioWorkspacePanel open={audioOpen} project={project} onProjectChange={(next) => { setProject(next); setIsDirty(true); }} onClose={() => setAudioOpen(false)} />
      <AssetLibraryPanel
        open={assetsOpen}
        project={project}
        onProjectChange={(nextProject) => { setProject(nextProject); setIsDirty(true); }}
        onClose={() => setAssetsOpen(false)}
      />
      <SettingsModal
        open={settingsOpen}
        appSettings={settings}
        projectSettings={project.projectSettings}
        onClose={() => setSettingsOpen(false)}
        onAppSettingsChange={setSettings}
        onProjectSettingsChange={handleProjectSettingsChange}
        onExportSupportBundle={reliability.exportSupportBundle}
        onResetSettings={reliability.resetSettings}
      />
      <TemplatePicker
        open={templatesOpen}
        templates={templates}
        currentProject={project}
        onClose={() => setTemplatesOpen(false)}
        onCreateFromTemplate={handleNewProjectFromTemplate}
      />
      <PluginManagerPanel
        open={pluginsOpen}
        extensions={extensionWorkspace.extensions}
        logs={extensionWorkspace.logs}
        safeMode={extensionWorkspace.safeMode}
        onClose={() => setPluginsOpen(false)}
        onInstallFile={handleInstallFile}
        mods={installedMods}
        onUninstallMod={handleUninstallMod}
        onToggleExtension={extensionWorkspace.setEnabled}
        onTrustExtension={extensionWorkspace.setTrusted}
        onUninstallExtension={extensionWorkspace.uninstall}
        onSafeModeChange={extensionWorkspace.setSafeMode}
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
        isExporting={isExporting}
        ffmpegDetection={ffmpegDetection}
        onClose={() => setExportOpen(false)}
        onSettingsChange={handleExportSettingsChange}
        onFfmpegSettingsChange={handleFfmpegSettingsChange}
        onDetectFfmpeg={handleDetectFfmpeg}
        onAddRenderJob={handleAddRenderJob}
        onRunRenderJob={handleRunRenderJob}
        onRemoveRenderJob={handleRemoveRenderJob}
        onClearFinishedRenderJobs={handleClearFinishedRenderJobs}
        onSavePackage={handleSaveProject}
        onExportLegacyProject={handleExportLegacyProject}
        onExportCurrentFrame={handleExportCurrentFrame}
        onExportSequence={handleExportSequence}
        onExportWebM={handleExportWebM}
        onExportWav={handleExportWav}
        onCancelExport={handleCancelExport}
      />
      <RigStudioPanel
        open={rigStudioOpen}
        project={project}
        selectedObjectId={selectedObjectId}
        posePresets={rigPosePresets}
        animationPresets={presets.animation}
        constraintWorkspace={rigConstraints}
        onClose={() => setRigStudioOpen(false)}
        onImportSkin={handleImportSkin}
        onResetSkin={handleResetSkin}
        workspaces={rigWorkspace}
        onApplyAnimation={rigWorkspace.applyAnimation}
        onGenerateProcedural={rigWorkspace.generateProceduralAnimation}
        onImportBlockbench={handleImportBlockbench}
        onUpdateIKControl={rigConstraints.ikSession.updateControl}
        onBakeIKControl={rigWorkspace.bakeIK}
        onBakeFootLock={rigWorkspace.bakeFootLock}
        onUpdateLookAtControl={rigConstraints.lookAtSession.updateControl}
        onBakeLookAt={rigWorkspace.bakeLookAt}
      />
      <LightingStudioPanel
        open={lightingStudioOpen}
        lighting={project.lighting}
        postProcessing={project.postProcessing}
        resources={project.minecraftResources}
        resourcePacks={project.assets.resourcePacks}
        currentFrame={project.animation.currentFrame}
        onClose={() => setLightingStudioOpen(false)}
        onApplyMood={handleApplyLightingMood}
        onUpdateLighting={handleUpdateLighting}
        onUpdatePostProcessing={handleUpdatePostProcessing}
        onUpdateResources={handleUpdateMinecraftResources}
        onChooseResourcePackZip={handleChooseResourcePackZip}
        onChooseResourcePackFolder={handleChooseResourcePackFolder}
        onSetActiveResourcePack={handleSetActiveResourcePack}
        onRemoveResourcePack={handleRemoveResourcePack}
        onAddEnvironmentKeyframe={handleAddEnvironmentKeyframe}
      />
      <VfxWorkspacePanel
        open={vfxWorkspaceOpen}
        presets={effectPresets}
        registry={vfxPackageRegistry}
        onRegistryChange={setVfxPackageRegistry}
        onClose={() => setVfxWorkspaceOpen(false)}
      />
      <ProductionWorkspacePanel
        open={productionOpen}
        project={project}
        projectSaved={!isDirty}
        ffmpegAvailable={ffmpegDetection.available}
        onClose={() => setProductionOpen(false)}
        onProjectChange={(nextProject, label) => commitProject(nextProject, label)}
        onSetFrame={handleSetFrame}
        onPreviewFrames={handlePreviewFrames}
      />
      <WorldImportPanel
        open={worldImportOpen}
        scan={worldScan}
        project={project}
        options={worldImportOptions}
        progress={worldImportProgress}
        isImporting={isWorldImporting}
        onClose={() => setWorldImportOpen(false)}
        onChooseWorldFolder={handleChooseWorldFolder}
        onOptionsChange={handleWorldImportOptionsChange}
        onImportChunks={handleImportWorldChunks}
        onReimportChangedChunks={handleReimportChangedWorldChunks}
        onUnloadSelectedChunks={handleUnloadSelectedWorldChunks}
        onHideSelectedChunks={handleHideSelectedWorldChunks}
        onShowAllChunks={handleShowAllWorldChunks}
        onAddSceneMarker={handleAddWorldSceneMarker}
        onAddSceneProp={handleAddWorldSceneProp}
        onRemoveSceneItem={handleRemoveWorldSceneItem}
        onSaveImportProfile={handleSaveWorldImportProfile}
        onApplyImportProfile={handleApplyWorldImportProfile}
        onDeleteImportProfile={handleDeleteWorldImportProfile}
        onCancelImport={handleCancelWorldImport}
        onFocusWorld={handleFocusWorld}
        onUnloadWorld={handleUnloadWorld}
      />
      <WorldGeneratorPanel
        open={worldGenOpen}
        onClose={() => setWorldGenOpen(false)}
        onGenerate={handleGenerateWorld}
        isGenerating={isGeneratingWorld}
        progress={worldGenProgress}
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
        ref={skinInputRef}
        className="hidden-input"
        type="file"
        accept="image/png,.png"
        onChange={handleSkinSelected}
      />
      <input
        ref={blockbenchInputRef}
        className="hidden-input"
        type="file"
        accept=".bbmodel,application/json,.json"
        onChange={handleBlockbenchSelected}
      />
      <input
        ref={audioInputRef}
        className="hidden-input"
        type="file"
        accept="audio/wav,audio/mpeg,audio/ogg,audio/mp3,.wav,.mp3,.ogg"
        onChange={handleAudioSelected}
      />
      <input
        ref={resourcePackZipInputRef}
        className="hidden-input"
        type="file"
        accept=".zip,application/zip"
        onChange={handleResourcePackZipSelected}
      />
      <input
        ref={resourcePackFolderInputRef}
        className="hidden-input"
        type="file"
        multiple
        {...{ webkitdirectory: "", directory: "" }}
        onChange={handleResourcePackFolderSelected}
      />
    </main>
    </LocalizationProvider>
  );
}

function selectedObjectLabel(
  project: MineMotionProject,
  selectedObjectId: string | null,
  fallback: string | undefined,
  characterLabel: string,
  noneLabel: string
): string {
  const boneSelection = parseRigBoneSelection(selectedObjectId);
  if (boneSelection) {
    const character = project.scene.characters.find(
      (item) => item.id === boneSelection.characterId
    );
    return `${character?.name ?? characterLabel} / ${boneSelection.boneId}`;
  }
  return fallback ?? noneLabel;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
