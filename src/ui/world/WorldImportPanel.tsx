import { Crosshair, Cuboid, FolderOpen, RefreshCw, Square, Trash2 } from "lucide-react";
import type { MinecraftWorldScan } from "../../minecraft/import/MinecraftChunkTypes";
import type {
  WorldChunkImportOptions
} from "../../minecraft/import/WorldImportManager";
import type { WorldImportProgress } from "../../minecraft/import/WorldImportProgress";
import type { MineMotionProject } from "../../project/ProjectFile";
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";
import { formatLocalizedDiagnostic } from "../../localization/LocalizationDiagnostics";

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
  const localization = useLocalization();
  const t = localization.t.bind(localization);
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
        aria-label={t("world.ariaLabel")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Cuboid size={18} />
            {t("world.title")}
          </h2>
          <button type="button" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>

        <div className="world-import-layout">
          <section>
            <h3>{t("world.folder")}</h3>
            <div className="world-import-actions">
              <button type="button" className="primary-action" onClick={onChooseWorldFolder}>
                <FolderOpen size={16} />
                {t("world.chooseFolder")}
              </button>
              <button type="button" onClick={onFocusWorld} disabled={!world?.importedChunks?.length}>
                <Crosshair size={16} />
                {t("world.focus")}
              </button>
              <button type="button" onClick={onUnloadWorld} disabled={!world}>
                <Trash2 size={16} />
                {t("world.unload")}
              </button>
            </div>
            {scan ? (
              <div className="world-summary">
                <Info label={t("world.info.folder")} value={scan.sourceName} />
                <Info label={t("world.info.level")} value={scan.level.levelName || t("world.unknown")} />
                <Info
                  label={t("world.info.dataVersion")}
                  value={scan.level.dataVersion?.toString() ?? t("world.unknown")}
                />
                <Info
                  label={t("world.info.spawn")}
                  value={scan.level.spawn ? scan.level.spawn.join(", ") : t("world.unknown")}
                />
              </div>
            ) : (
              <p className="empty-note">
                {t("world.scanPrompt")}
              </p>
            )}
          </section>

          <section>
            <h3>{t("world.selection")}</h3>
            <label>
              {t("world.dimension")}
              <select
                value={options.dimension}
                onChange={(event) =>
                  updateOptions({
                    dimension: event.target.value as WorldChunkImportOptions["dimension"]
                  })
                }
              >
                <option value="overworld">{t("world.dimension.overworld")}</option>
                <option value="nether">{t("world.dimension.nether")}</option>
                <option value="end">{t("world.dimension.end")}</option>
              </select>
            </label>
            <div className="export-grid-2">
              <NumberField
                label={t("world.centerX")}
                value={options.centerChunkX}
                onChange={(centerChunkX) => updateOptions({ centerChunkX })}
              />
              <NumberField
                label={t("world.centerZ")}
                value={options.centerChunkZ}
                onChange={(centerChunkZ) => updateOptions({ centerChunkZ })}
              />
              <NumberField
                label={t("world.radius")}
                value={options.radiusChunks}
                min={0}
                max={16}
                onChange={(radiusChunks) => updateOptions({ radiusChunks })}
              />
              <NumberField
                label={t("world.maxChunks")}
                value={options.maxChunks}
                min={1}
                max={256}
                onChange={(maxChunks) => updateOptions({ maxChunks })}
              />
              <NumberField
                label={t("world.maxRegions")}
                value={options.maxRegionFiles}
                min={1}
                max={16}
                onChange={(maxRegionFiles) => updateOptions({ maxRegionFiles })}
              />
              <NumberField
                label={t("world.maxSections")}
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
              {t("world.showBorders")}
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.showWorldOrigin}
                onChange={(event) =>
                  updateOptions({ showWorldOrigin: event.target.checked })
                }
              />
              {t("world.showOrigin")}
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.embedImportedChunkCache}
                onChange={(event) =>
                  updateOptions({ embedImportedChunkCache: event.target.checked })
                }
              />
              {t("world.embedCache")}
            </label>
          </section>

          <section>
            <h3>{t("world.dimensions")}</h3>
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
                    <span>{localization.plural({ one: "world.regions.one", other: "world.regions.other" }, dimension.regionFiles.length)}</span>
                    <small>{localization.plural({ one: "world.estimatedChunks.one", other: "world.estimatedChunks.other" }, dimension.estimatedChunks)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-note">{t("world.noScan")}</p>
            )}
            {selectedDimension && (
              <p className="empty-note">
                {localization.plural({ one: "world.selectedRegions.one", other: "world.selectedRegions.other" }, selectedDimension.regionFiles.length)}
              </p>
            )}
          </section>

          <section>
            <h3>{t("world.runImport")}</h3>
            <div className="world-import-actions">
              <button
                type="button"
                className="primary-action"
                disabled={!scan || isImporting}
                onClick={onImportChunks}
              >
                <RefreshCw size={16} />
                {t("world.importChunks")}
              </button>
              <button type="button" disabled={!isImporting} onClick={onCancelImport}>
                <Square size={16} />
                {t("world.cancel")}
              </button>
            </div>
            <div className="export-progress">
              <strong>{t(`world.status.${progress.status}` as TranslationKey)}</strong>
              <span>{t(`world.progress.${progress.status}` as TranslationKey)}</span>
              {progress.total > 0 && (
                <progress value={progress.current} max={progress.total} />
              )}
              {progress.error && <small>{formatLocalizedDiagnostic(localization, "WORLD_IMPORT_FAILED", "app.worldImportFailed")}</small>}
            </div>
            {world?.performanceEstimate && (
              <div className="world-summary">
                <Info
                  label={t("world.chunks")}
                  value={String(world.performanceEstimate.importedChunks)}
                />
                <Info
                  label={t("world.blocks")}
                  value={String(world.performanceEstimate.importedBlocks)}
                />
                <Info
                  label={t("world.unknownBlocks")}
                  value={String(world.unknownBlockCount ?? 0)}
                />
              </div>
            )}
          </section>
        </div>

        {warnings.length > 0 && (
          <div className="warning-note">
            <strong>{t("world.warnings")}</strong>
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
