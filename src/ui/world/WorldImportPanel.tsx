import { Crosshair, Cuboid, FolderOpen, RefreshCw, Square, Trash2 } from "lucide-react";
import type { MinecraftWorldScan } from "../../minecraft/import/MinecraftChunkTypes";
import type {
  WorldChunkImportOptions
} from "../../minecraft/import/WorldImportManager";
import type { WorldImportProgress } from "../../minecraft/import/WorldImportProgress";
import type { MineMotionProject } from "../../project/ProjectFile";

interface WorldImportPanelProps {
  open: boolean;
  scan: MinecraftWorldScan | null;
  project: MineMotionProject;
  options: WorldChunkImportOptions;
  progress: WorldImportProgress;
  isImporting: boolean;
  onClose: () => void;
  onChooseWorldFolder: () => void;
  onOptionsChange: (options: WorldChunkImportOptions) => void;
  onImportChunks: () => void;
  onCancelImport: () => void;
  onFocusWorld: () => void;
  onUnloadWorld: () => void;
}

export function WorldImportPanel({
  open,
  scan,
  project,
  options,
  progress,
  isImporting,
  onClose,
  onChooseWorldFolder,
  onOptionsChange,
  onImportChunks,
  onCancelImport,
  onFocusWorld,
  onUnloadWorld
}: WorldImportPanelProps) {
  if (!open) return null;

  const world = project.world;
  const selectedDimension = scan?.dimensions.find(
    (dimension) => dimension.id === options.dimension
  );
  const warnings = [
    ...(scan?.warnings ?? []),
    ...(world?.notes ?? [])
  ].filter(Boolean);

  const updateOptions = (patch: Partial<WorldChunkImportOptions>) =>
    onOptionsChange({
      ...options,
      ...patch
    });

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel world-import-modal"
        role="dialog"
        aria-modal="true"
        aria-label="World import"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Cuboid size={18} />
            World Import
          </h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="world-import-layout">
          <section>
            <h3>World Folder</h3>
            <div className="world-import-actions">
              <button type="button" className="primary-action" onClick={onChooseWorldFolder}>
                <FolderOpen size={16} />
                Choose Folder
              </button>
              <button type="button" onClick={onFocusWorld} disabled={!world?.importedChunks?.length}>
                <Crosshair size={16} />
                Focus World
              </button>
              <button type="button" onClick={onUnloadWorld} disabled={!world}>
                <Trash2 size={16} />
                Unload
              </button>
            </div>
            {scan ? (
              <div className="world-summary">
                <Info label="Folder" value={scan.sourceName} />
                <Info label="Level" value={scan.level.levelName || "unknown"} />
                <Info
                  label="Data version"
                  value={scan.level.dataVersion?.toString() ?? "unknown"}
                />
                <Info
                  label="Spawn"
                  value={scan.level.spawn ? scan.level.spawn.join(", ") : "unknown"}
                />
              </div>
            ) : (
              <p className="empty-note">
                Select a Minecraft world folder to scan `level.dat` and `.mca`
                region files.
              </p>
            )}
          </section>

          <section>
            <h3>Import Selection</h3>
            <label>
              Dimension
              <select
                value={options.dimension}
                onChange={(event) =>
                  updateOptions({
                    dimension: event.target.value as WorldChunkImportOptions["dimension"]
                  })
                }
              >
                <option value="overworld">Overworld</option>
                <option value="nether">Nether</option>
                <option value="end">End</option>
              </select>
            </label>
            <div className="export-grid-2">
              <NumberField
                label="Center chunk X"
                value={options.centerChunkX}
                onChange={(centerChunkX) => updateOptions({ centerChunkX })}
              />
              <NumberField
                label="Center chunk Z"
                value={options.centerChunkZ}
                onChange={(centerChunkZ) => updateOptions({ centerChunkZ })}
              />
              <NumberField
                label="Radius"
                value={options.radiusChunks}
                min={0}
                max={16}
                onChange={(radiusChunks) => updateOptions({ radiusChunks })}
              />
              <NumberField
                label="Max chunks"
                value={options.maxChunks}
                min={1}
                max={256}
                onChange={(maxChunks) => updateOptions({ maxChunks })}
              />
              <NumberField
                label="Max regions"
                value={options.maxRegionFiles}
                min={1}
                max={16}
                onChange={(maxRegionFiles) => updateOptions({ maxRegionFiles })}
              />
              <NumberField
                label="Max sections"
                value={options.maxVerticalSections}
                min={1}
                max={32}
                onChange={(maxVerticalSections) =>
                  updateOptions({ maxVerticalSections })
                }
              />
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.showChunkBorders}
                onChange={(event) =>
                  updateOptions({ showChunkBorders: event.target.checked })
                }
              />
              Show chunk borders
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.showWorldOrigin}
                onChange={(event) =>
                  updateOptions({ showWorldOrigin: event.target.checked })
                }
              />
              Show world origin
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.embedImportedChunkCache}
                onChange={(event) =>
                  updateOptions({ embedImportedChunkCache: event.target.checked })
                }
              />
              Embed imported chunk cache in project
            </label>
          </section>

          <section>
            <h3>Dimensions</h3>
            {scan ? (
              <div className="world-dimension-list">
                {scan.dimensions.map((dimension) => (
                  <button
                    key={dimension.id}
                    type="button"
                    className={dimension.id === options.dimension ? "selected" : ""}
                    onClick={() => updateOptions({ dimension: dimension.id })}
                  >
                    <strong>{dimension.label}</strong>
                    <span>{dimension.regionFiles.length} regions</span>
                    <small>{dimension.estimatedChunks} estimated chunks</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-note">No folder scanned yet.</p>
            )}
            {selectedDimension && (
              <p className="empty-note">
                Selected dimension has {selectedDimension.regionFiles.length} region files.
              </p>
            )}
          </section>

          <section>
            <h3>Run Import</h3>
            <div className="world-import-actions">
              <button
                type="button"
                className="primary-action"
                disabled={!scan || isImporting}
                onClick={onImportChunks}
              >
                <RefreshCw size={16} />
                Import Chunks
              </button>
              <button type="button" disabled={!isImporting} onClick={onCancelImport}>
                <Square size={16} />
                Cancel
              </button>
            </div>
            <div className="export-progress">
              <strong>{progress.status}</strong>
              <span>{progress.message}</span>
              {progress.total > 0 && (
                <progress value={progress.current} max={progress.total} />
              )}
              {progress.error && <small>{progress.error}</small>}
            </div>
            {world?.performanceEstimate && (
              <div className="world-summary">
                <Info
                  label="Chunks"
                  value={String(world.performanceEstimate.importedChunks)}
                />
                <Info
                  label="Blocks"
                  value={String(world.performanceEstimate.importedBlocks)}
                />
                <Info
                  label="Unknown"
                  value={String(world.unknownBlockCount ?? 0)}
                />
              </div>
            )}
          </section>
        </div>

        {warnings.length > 0 && (
          <div className="warning-note">
            <strong>Warnings</strong>
            <ul>
              {[...new Set(warnings)].slice(0, 12).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
