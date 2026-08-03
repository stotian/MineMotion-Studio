import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent
} from "react";
import {
  isOperationAborted,
  LatestOperationController
} from "../../core/async/LatestOperationController";
import type {
  LocalizationDiagnosticCode
} from "../../localization/LocalizationDiagnostics";
import type {
  TranslationKey,
  TranslationValues
} from "../../localization/LocalizationTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import { updateProjectSettings } from "../../project/ProjectStore";
import type {
  ImportedChunkRange,
  MinecraftWorldScan
} from "./MinecraftChunkTypes";
import type { BlockId } from "../MinecraftWorldTypes";
import {
  addWorldPropBlock,
  addWorldSceneMarker,
  hideChunksInSelection,
  removeWorldSceneItem,
  showAllWorldChunks,
  withWorldSceneOverridesDefaults,
  type WorldSceneMarkerKind
} from "../staging/WorldSceneOverrides";
import {
  DEFAULT_WORLD_IMPORT_OPTIONS,
  WorldImportManager,
  type WorldChunkImportOptions
} from "./WorldImportManager";
import {
  applyWorldImportProfile,
  createWorldImportProfile,
  removeWorldImportProfile,
  saveWorldImportProfile
} from "./WorldImportProfiles";
import {
  createWorldImportProgress,
  IDLE_WORLD_IMPORT_PROGRESS,
  isWorldImportInProgress
} from "./WorldImportProgress";

type ProjectCommit = (
  updater:
    | MineMotionProject
    | ((currentProject: MineMotionProject) => MineMotionProject),
  label: string
) => boolean;

type ProjectSetter = (
  updater:
    | MineMotionProject
    | ((currentProject: MineMotionProject) => MineMotionProject)
) => void;

interface WorldImportOperationsOptions {
  project: MineMotionProject;
  commitProject: ProjectCommit;
  setProject: ProjectSetter;
  setDirty: (dirty: boolean) => void;
  setSelectedObjectId: (objectId: string | null) => void;
  requestWorldFocus: () => void;
  setPanelOpen: (open: boolean) => void;
  setStatus: (status: string) => void;
  tr: (key: TranslationKey, values?: TranslationValues) => string;
  diagnostic: (
    code: LocalizationDiagnosticCode,
    key: TranslationKey,
    values?: TranslationValues
  ) => string;
}

export function useWorldImportOperations({
  project,
  commitProject,
  setProject,
  setDirty,
  setSelectedObjectId,
  requestWorldFocus,
  setPanelOpen,
  setStatus,
  tr,
  diagnostic
}: WorldImportOperationsOptions) {
  const [scan, setScan] = useState<MinecraftWorldScan | null>(null);
  const [importOptions, setImportOptions] =
    useState<WorldChunkImportOptions>(DEFAULT_WORLD_IMPORT_OPTIONS);
  const [progress, setProgress] = useState(IDLE_WORLD_IMPORT_PROGRESS);
  const operationRef = useRef(new LatestOperationController());

  useEffect(
    () => () => {
      operationRef.current.cancel("Editor closed.");
    },
    []
  );

  const reset = useCallback((message = "World import reset.") => {
    operationRef.current.cancel(message);
    setScan(null);
    setImportOptions(DEFAULT_WORLD_IMPORT_OPTIONS);
    setProgress(IDLE_WORLD_IMPORT_PROGRESS);
  }, []);

  const selectWorld = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      event.target.value = "";
      if (!files || files.length === 0) return;

      const operation = operationRef.current.start();
      try {
        setProgress(
          createWorldImportProgress({
            operationId: operation.operationId,
            status: "scanning",
            message: tr("app.worldScanning")
          })
        );
        const nextScan = await WorldImportManager.scan(files, operation.signal);
        if (!operationRef.current.isCurrent(operation.operationId)) return;

        const spawn = nextScan.level.spawn;
        const nextOptions: WorldChunkImportOptions = {
          ...importOptions,
          centerChunkX: spawn
            ? Math.floor(spawn[0] / 16)
            : importOptions.centerChunkX,
          centerChunkZ: spawn
            ? Math.floor(spawn[2] / 16)
            : importOptions.centerChunkZ
        };
        const scannedWorld = WorldImportManager.createSummaryFromScan(
          nextScan,
          nextOptions
        );
        setScan(nextScan);
        setImportOptions(nextOptions);
        setPanelOpen(true);
        commitProject(
          (currentProject) =>
            updateProjectSettings(
              { ...currentProject, world: scannedWorld },
              {
                worldSourcePath:
                  scannedWorld.sourcePath ?? scannedWorld.sourceName
              }
            ),
          "Scan world folder"
        );
        setSelectedObjectId("world");
        const regionFiles = nextScan.dimensions.reduce(
          (sum, dimension) => sum + dimension.regionFiles.length,
          0
        );
        setProgress(
          createWorldImportProgress({
            operationId: operation.operationId,
            status: "complete",
            current: regionFiles,
            total: regionFiles,
            message: tr("app.worldScanned", { name: nextScan.sourceName })
          })
        );
        setStatus(
          tr("app.worldScanComplete", {
            name: nextScan.sourceName,
            dimensions: nextScan.dimensions
              .map(
                (dimension) =>
                  `${dimension.label} ${dimension.regionFiles.length}`
              )
              .join(", ")
          })
        );
      } catch (error) {
        if (
          isOperationAborted(error) ||
          !operationRef.current.isCurrent(operation.operationId)
        ) {
          return;
        }
        const message = diagnostic(
          "WORLD_SCAN_FAILED",
          "app.worldScanFailed"
        );
        setProgress(
          createWorldImportProgress({
            operationId: operation.operationId,
            status: "error",
            message,
            error: message
          })
        );
        setStatus(message);
      } finally {
        operationRef.current.finish(operation.operationId);
      }
    },
    [
      commitProject,
      diagnostic,
      importOptions,
      setPanelOpen,
      setSelectedObjectId,
      setStatus,
      tr
    ]
  );

  const updateOptions = useCallback(
    (options: WorldChunkImportOptions) => {
      setImportOptions(options);
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
      if (project.world) setDirty(true);
    },
    [project.world, setDirty, setProject]
  );

  const runImport = useCallback(async (mode: "replace" | "update-changed") => {
    if (!scan) {
      setStatus(tr("app.chooseWorld"));
      return;
    }

    const operation = operationRef.current.start();
    setProgress(
      createWorldImportProgress({
        operationId: operation.operationId,
        status: "reading-regions",
        message: tr("app.worldPreparing")
      })
    );

    try {
      const result = await WorldImportManager.importChunks({
        scan,
        importOptions,
        operationId: operation.operationId,
        signal: operation.signal,
        mode,
        existingWorld: project.world,
        onProgress: (nextProgress) => {
          if (
            nextProgress.operationId === operation.operationId &&
            operationRef.current.isCurrent(operation.operationId)
          ) {
            setProgress(nextProgress);
          }
        }
      });
      if (
        result.operationId !== operation.operationId ||
        !operationRef.current.isCurrent(operation.operationId)
      ) {
        return;
      }
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
              worldSourcePath:
                result.world.sourcePath ?? result.world.sourceName
            }
          ),
        mode === "update-changed"
          ? "Update changed Minecraft chunks"
          : "Import Minecraft chunks"
      );
      setSelectedObjectId("world");
      requestWorldFocus();
      setStatus(
        mode === "update-changed"
          ? tr("app.worldUpdated", {
              decoded: result.decodedChunks,
              reused: result.reusedChunks,
              chunks: result.chunks.length
            })
          : tr("app.worldImported", {
              chunks: result.chunks.length,
              blocks: result.estimate.importedBlocks,
              name: result.world.sourceName
            })
      );
    } catch (error) {
      if (
        isOperationAborted(error) ||
        !operationRef.current.isCurrent(operation.operationId)
      ) {
        return;
      }
      const message = diagnostic(
        "WORLD_IMPORT_FAILED",
        "app.worldImportFailed"
      );
      setProgress(
        createWorldImportProgress({
          operationId: operation.operationId,
          status: "error",
          message,
          error: message
        })
      );
      setStatus(message);
    } finally {
      operationRef.current.finish(operation.operationId);
    }
  }, [
    commitProject,
    diagnostic,
    importOptions,
    project.world,
    requestWorldFocus,
    scan,
    setSelectedObjectId,
    setStatus,
    tr
  ]);

  const importChunks = useCallback(
    async () => await runImport("replace"),
    [runImport]
  );

  const reimportChangedChunks = useCallback(
    async () => await runImport("update-changed"),
    [runImport]
  );

  const unloadSelectedChunks = useCallback(() => {
    if (!project.world) return;
    const nextWorld = WorldImportManager.unloadChunks(project.world, importOptions);
    commitProject(
      (currentProject) => ({
        ...currentProject,
        world: nextWorld,
        projectSettings: {
          ...currentProject.projectSettings,
          terrainPreset:
            (nextWorld.importedChunks?.length ?? 0) > 0
              ? "none"
              : "demo"
        }
      }),
      "Unload selected Minecraft chunks"
    );
    setStatus(tr("app.worldSelectionUnloaded", {
      chunks: nextWorld.importedChunks?.length ?? 0
    }));
  }, [commitProject, importOptions, project.world, setStatus, tr]);

  const updateSceneOverrides = useCallback((
    updater: (
      overrides: ReturnType<typeof withWorldSceneOverridesDefaults>,
      world: NonNullable<MineMotionProject["world"]>,
      selection: ImportedChunkRange
    ) => ReturnType<typeof withWorldSceneOverridesDefaults>,
    label: string,
    status: string
  ) => {
    if (!project.world) return;
    const selection = snapshotImportSelection(importOptions);
    commitProject(
      (currentProject) => currentProject.world
        ? {
            ...currentProject,
            world: {
              ...currentProject.world,
              sceneOverrides: updater(
                withWorldSceneOverridesDefaults(currentProject.world.sceneOverrides),
                currentProject.world,
                selection
              )
            }
          }
        : currentProject,
      label
    );
    setStatus(status);
  }, [commitProject, importOptions, project.world, setStatus]);

  const hideSelectedChunks = useCallback(() => {
    updateSceneOverrides(
      (overrides, world, selection) => hideChunksInSelection(
        overrides,
        world.importedChunks ?? [],
        selection
      ),
      "Hide selected Minecraft chunks",
      tr("app.worldSelectionHidden")
    );
  }, [tr, updateSceneOverrides]);

  const showAllChunks = useCallback(() => {
    updateSceneOverrides(
      (overrides) => showAllWorldChunks(overrides),
      "Show all Minecraft chunks",
      tr("app.worldAllChunksShown")
    );
  }, [tr, updateSceneOverrides]);

  const addSceneMarker = useCallback((kind: WorldSceneMarkerKind) => {
    updateSceneOverrides(
      (overrides, world, selection) => addWorldSceneMarker(
        overrides,
        world,
        selection,
        kind
      ),
      `Add Minecraft world ${kind}`,
      tr("app.worldSceneItemAdded", { kind })
    );
  }, [tr, updateSceneOverrides]);

  const addSceneProp = useCallback((blockId: BlockId = "stone") => {
    updateSceneOverrides(
      (overrides, world, selection) => addWorldPropBlock(
        overrides,
        world,
        selection,
        blockId
      ),
      "Add Minecraft scene prop",
      tr("app.worldSceneItemAdded", { kind: blockId })
    );
  }, [tr, updateSceneOverrides]);

  const removeSceneItem = useCallback((itemId: string) => {
    updateSceneOverrides(
      (overrides) => removeWorldSceneItem(overrides, itemId),
      "Remove Minecraft scene item",
      tr("app.worldSceneItemRemoved")
    );
  }, [tr, updateSceneOverrides]);

  const saveImportProfile = useCallback((name: string) => {
    if (!project.world) return;
    const profile = createWorldImportProfile(name, importOptions);
    commitProject(
      (currentProject) => currentProject.world
        ? {
            ...currentProject,
            world: {
              ...currentProject.world,
              importProfiles: saveWorldImportProfile(
                currentProject.world.importProfiles,
                profile
              )
            }
          }
        : currentProject,
      "Save Minecraft import profile"
    );
    setStatus(tr("app.worldProfileSaved", { name: profile.name }));
  }, [commitProject, importOptions, project.world, setStatus, tr]);

  const applyImportProfileById = useCallback((profileId: string) => {
    const profile = project.world?.importProfiles?.find((item) => item.id === profileId);
    if (!profile) return;
    const nextOptions = applyWorldImportProfile(profile, importOptions);
    updateOptions(nextOptions);
    setStatus(tr("app.worldProfileApplied", { name: profile.name }));
  }, [importOptions, project.world?.importProfiles, setStatus, tr, updateOptions]);

  const deleteImportProfile = useCallback((profileId: string) => {
    const profile = project.world?.importProfiles?.find((item) => item.id === profileId);
    if (!project.world || !profile) return;
    commitProject(
      (currentProject) => currentProject.world
        ? {
            ...currentProject,
            world: {
              ...currentProject.world,
              importProfiles: removeWorldImportProfile(
                currentProject.world.importProfiles,
                profileId
              )
            }
          }
        : currentProject,
      "Delete Minecraft import profile"
    );
    setStatus(tr("app.worldProfileDeleted", { name: profile.name }));
  }, [commitProject, project.world, setStatus, tr]);

  const cancel = useCallback(() => {
    const operationId = operationRef.current.cancel();
    setProgress(
      createWorldImportProgress({
        operationId,
        status: "cancelled",
        message: tr("app.worldCancel")
      })
    );
    setStatus(tr("app.worldCancel"));
  }, [setStatus, tr]);

  return {
    scan,
    importOptions,
    progress,
    isImporting: isWorldImportInProgress(progress),
    selectWorld,
    updateOptions,
    importChunks,
    reimportChangedChunks,
    unloadSelectedChunks,
    hideSelectedChunks,
    showAllChunks,
    addSceneMarker,
    addSceneProp,
    removeSceneItem,
    saveImportProfile,
    applyImportProfile: applyImportProfileById,
    deleteImportProfile,
    cancel,
    reset
  };
}

function snapshotImportSelection(options: WorldChunkImportOptions): ImportedChunkRange {
  return {
    dimension: options.dimension,
    centerChunkX: Math.trunc(Number.isFinite(options.centerChunkX) ? options.centerChunkX : 0),
    centerChunkZ: Math.trunc(Number.isFinite(options.centerChunkZ) ? options.centerChunkZ : 0),
    radiusChunks: Math.max(0, Math.trunc(Number.isFinite(options.radiusChunks) ? options.radiusChunks : 0)),
    maxChunks: Math.max(1, Math.trunc(Number.isFinite(options.maxChunks) ? options.maxChunks : 1)),
    maxRegionFiles: Math.max(1, Math.trunc(Number.isFinite(options.maxRegionFiles) ? options.maxRegionFiles : 1)),
    maxVerticalSections: Math.max(1, Math.trunc(Number.isFinite(options.maxVerticalSections) ? options.maxVerticalSections : 1))
  };
}
