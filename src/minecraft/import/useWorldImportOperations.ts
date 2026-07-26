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
import type { MinecraftWorldScan } from "./MinecraftChunkTypes";
import {
  DEFAULT_WORLD_IMPORT_OPTIONS,
  WorldImportManager,
  type WorldChunkImportOptions
} from "./WorldImportManager";
import {
  createWorldImportProgress,
  IDLE_WORLD_IMPORT_PROGRESS
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

  const importChunks = useCallback(async () => {
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
        "Import Minecraft chunks"
      );
      setSelectedObjectId("world");
      requestWorldFocus();
      setStatus(
        tr("app.worldImported", {
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
    requestWorldFocus,
    scan,
    setSelectedObjectId,
    setStatus,
    tr
  ]);

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
    selectWorld,
    updateOptions,
    importChunks,
    cancel,
    reset
  };
}
