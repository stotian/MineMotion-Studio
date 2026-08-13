import { useState } from "react";
import { Crosshair, Cuboid, FolderOpen, RefreshCw, Square, Trash2 } from "lucide-react";
import type {
  MinecraftDimensionId,
  MinecraftWorldScan
} from "../../minecraft/import/MinecraftChunkTypes";
import type {
  WorldChunkImportOptions
} from "../../minecraft/import/WorldImportManager";
import type { WorldImportProgress } from "../../minecraft/import/WorldImportProgress";
import {
  centerChunkForRegion,
  createWorldImportRequestEstimate,
  createWorldSelectionPreview
} from "../../minecraft/import/WorldImportSelection";
import type { MineMotionProject } from "../../project/ProjectFile";
import type { BlockId } from "../../minecraft/MinecraftWorldTypes";
import type { WorldSceneMarkerKind } from "../../minecraft/staging/WorldSceneOverrides";
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";
import { formatLocalizedDiagnostic } from "../../localization/LocalizationDiagnostics";

export interface WorldImportPanelProps {
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
  onReimportChangedChunks: () => void;
  onUnloadSelectedChunks: () => void;
  onHideSelectedChunks: () => void;
  onShowAllChunks: () => void;
  onAddSceneMarker: (kind: WorldSceneMarkerKind) => void;
  onAddSceneProp: (blockId: BlockId) => void;
  onRemoveSceneItem: (itemId: string) => void;
  onSaveImportProfile: (name: string) => void;
  onApplyImportProfile: (profileId: string) => void;
  onDeleteImportProfile: (profileId: string) => void;
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
  onReimportChangedChunks,
  onUnloadSelectedChunks,
  onHideSelectedChunks,
  onShowAllChunks,
  onAddSceneMarker,
  onAddSceneProp,
  onRemoveSceneItem,
  onSaveImportProfile,
  onApplyImportProfile,
  onDeleteImportProfile,
  onCancelImport,
  onFocusWorld,
  onUnloadWorld
}: WorldImportPanelProps) {
  const localization = useLocalization();
  const [profileName, setProfileName] = useState("");
  const t = localization.t.bind(localization);
  if (!open) return null;

  const world = project.world;
  const dimensionOptions = scan?.dimensions.length
    ? scan.dimensions
    : DEFAULT_DIMENSION_OPTIONS;
  const selectedDimension = scan?.dimensions.find(
    (dimension) => dimension.id === options.dimension
  );
  const selectionPreview = createWorldSelectionPreview(selectedDimension, options);
  const requestEstimate = createWorldImportRequestEstimate(selectedDimension, options);
  const selectableRegions = (selectedDimension?.regionFiles ?? [])
    .filter((region) => region.regionX !== null && region.regionZ !== null)
    .sort((a, b) =>
      a.regionZ === b.regionZ
        ? (a.regionX ?? 0) - (b.regionX ?? 0)
        : (a.regionZ ?? 0) - (b.regionZ ?? 0)
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
                {dimensionOptions.map((dimension) => (
                  <option key={dimension.id} value={dimension.id}>
                    {localizedDimensionLabel(t, dimension.id, dimension.label)}
                  </option>
                ))}
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
            <h3>{t("world.profiles")}</h3>
            <div className="world-import-actions">
              <input
                type="text"
                value={profileName}
                maxLength={80}
                placeholder={t("world.profileName")}
                onChange={(event) => setProfileName(event.target.value)}
              />
              <button
                type="button"
                disabled={!world || !profileName.trim()}
                onClick={() => {
                  onSaveImportProfile(profileName);
                  setProfileName("");
                }}
              >
                {t("world.saveProfile")}
              </button>
            </div>
            {(world?.importProfiles?.length ?? 0) > 0 ? (
              <div className="world-staging-list">
                {world!.importProfiles!.map((profile) => (
                  <div key={profile.id} className="world-staging-row">
                    <span>
                      <strong>{profile.name}</strong>
                      <small>{profile.dimension}{" · "}{profile.centerChunkX}, {profile.centerChunkZ}{" · r="}{profile.radiusChunks}</small>
                    </span>
                    <span className="world-profile-actions">
                      <button type="button" onClick={() => onApplyImportProfile(profile.id)}>
                        {t("world.applyProfile")}
                      </button>
                      <button type="button" onClick={() => onDeleteImportProfile(profile.id)}>
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-note">{t("world.noProfiles")}</p>
            )}
          </section>

          <section className="world-selection-preview-section">
            <h3>{t("world.preview.title")}</h3>
            {selectedDimension ? (
              <>
                <div className="world-region-picker" aria-label={t("world.preview.regionsAria")}>
                  {selectableRegions.slice(0, 32).map((region) => {
                    const selected =
                      Math.floor(options.centerChunkX / 32) === region.regionX &&
                      Math.floor(options.centerChunkZ / 32) === region.regionZ;
                    return (
                      <button
                        key={region.path}
                        type="button"
                        className={selected ? "selected" : ""}
                        title={region.path}
                        onClick={() =>
                          updateOptions(centerChunkForRegion(region.regionX!, region.regionZ!))
                        }
                      >
                        {"r."}{region.regionX}.{region.regionZ}
                      </button>
                    );
                  })}
                </div>
                {selectableRegions.length > 32 && (
                  <small className="empty-note">
                    {t("world.preview.regionLimit", {
                      count: localization.formatNumber(selectableRegions.length)
                    })}
                  </small>
                )}
                <div
                  className="world-chunk-preview"
                  style={{
                    gridTemplateColumns: `repeat(${selectionPreview.sideLength}, minmax(18px, 1fr))`
                  }}
                  aria-label={t("world.preview.chunksAria")}
                >
                  {selectionPreview.cells.map((cell) => (
                    <button
                      key={`${cell.chunkX},${cell.chunkZ}`}
                      type="button"
                      className={[
                        cell.center ? "center" : "",
                        cell.sourceRegionAvailable ? "available" : "missing"
                      ].filter(Boolean).join(" ")}
                      title={t("world.preview.chunkTitle", {
                        x: cell.chunkX,
                        z: cell.chunkZ,
                        regionX: cell.regionX,
                        regionZ: cell.regionZ
                      })}
                      aria-label={t("world.preview.chunkAria", {
                        x: cell.chunkX,
                        z: cell.chunkZ
                      })}
                      onClick={() =>
                        updateOptions({ centerChunkX: cell.chunkX, centerChunkZ: cell.chunkZ })
                      }
                    >
                      {cell.center ? "•" : ""}
                    </button>
                  ))}
                </div>
                <div className="world-preview-legend">
                  <span><i className="available" />{t("world.preview.available")}</span>
                  <span><i className="missing" />{t("world.preview.missing")}</span>
                  <span><i className="center" />{t("world.preview.center")}</span>
                </div>
                {selectionPreview.clipped && (
                  <p className="empty-note">{t("world.preview.clipped", { radius: selectionPreview.radius })}</p>
                )}
                <div className="world-summary world-import-estimate">
                  <Info
                    label={t("world.estimate.regions")}
                    value={localization.formatNumber(requestEstimate.selectedRegionFiles)}
                  />
                  <Info
                    label={t("world.estimate.area")}
                    value={localization.formatNumber(requestEstimate.requestedAreaChunks)}
                  />
                  <Info
                    label={t("world.estimate.chunks")}
                    value={localization.formatNumber(requestEstimate.boundedChunkCandidates)}
                  />
                  <Info
                    label={t("world.estimate.blocks")}
                    value={localization.formatNumber(requestEstimate.maximumDecodedBlocks)}
                  />
                  <Info
                    label={t("world.estimate.memory")}
                    value={formatByteEstimate(localization, requestEstimate.maximumEstimatedMemoryBytes)}
                  />
                </div>
                <p className="empty-note">{t("world.estimate.note")}</p>
              </>
            ) : (
              <p className="empty-note">{t("world.preview.noDimension")}</p>
            )}
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
            <h3>{t("world.staging")}</h3>
            <p className="empty-note">{t("world.sourceReadOnly")}</p>
            <div className="world-import-actions">
              <button
                type="button"
                disabled={!world?.importedChunks?.length}
                onClick={onHideSelectedChunks}
              >
                {t("world.hideSelection")}
              </button>
              <button
                type="button"
                disabled={!world?.sceneOverrides?.hiddenChunkIds.length}
                onClick={onShowAllChunks}
              >
                {t("world.showAllChunks")}
              </button>
              <button type="button" disabled={!world} onClick={() => onAddSceneMarker("marker")}>
                {t("world.addMarker")}
              </button>
              <button type="button" disabled={!world} onClick={() => onAddSceneMarker("anchor")}>
                {t("world.addAnchor")}
              </button>
              <button type="button" disabled={!world} onClick={() => onAddSceneMarker("collision")}>
                {t("world.addCollision")}
              </button>
              <button type="button" disabled={!world} onClick={() => onAddSceneProp("glowstone")}>
                {t("world.addGlowstoneProp")}
              </button>
            </div>
            <div className="world-summary">
              <Info
                label={t("world.hiddenChunks")}
                value={String(world?.sceneOverrides?.hiddenChunkIds.length ?? 0)}
              />
              <Info
                label={t("world.sceneMarkers")}
                value={String(world?.sceneOverrides?.markers.length ?? 0)}
              />
              <Info
                label={t("world.sceneProps")}
                value={String(world?.sceneOverrides?.propBlocks.length ?? 0)}
              />
            </div>
            {((world?.sceneOverrides?.markers.length ?? 0) > 0 ||
              (world?.sceneOverrides?.propBlocks.length ?? 0) > 0) && (
              <div className="world-staging-list">
                {[
                  ...(world?.sceneOverrides?.markers ?? []).map((item) => ({
                    id: item.id,
                    label: item.label,
                    detail: `${item.kind} · ${item.position.join(", ")}`
                  })),
                  ...(world?.sceneOverrides?.propBlocks ?? []).map((item) => ({
                    id: item.id,
                    label: item.blockId,
                    detail: `prop · ${item.position.join(", ")}`
                  }))
                ].map((item) => (
                  <div key={item.id} className="world-staging-row">
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <button type="button" onClick={() => onRemoveSceneItem(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
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
              <button
                type="button"
                disabled={!scan || !world?.importedChunks?.length || isImporting}
                onClick={onReimportChangedChunks}
              >
                <RefreshCw size={16} />
                {t("world.reimportChanged")}
              </button>
              <button
                type="button"
                disabled={!world?.importedChunks?.length || isImporting}
                onClick={onUnloadSelectedChunks}
              >
                <Trash2 size={16} />
                {t("world.unloadSelection")}
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
                <Info
                  label={t("world.cacheSize")}
                  value={formatByteEstimate(localization, world.cachedMesh?.estimatedBytes ?? 0)}
                />
                <Info
                  label={t("world.cacheStatus")}
                  value={world.cachedMesh?.sizeWarning
                    ? t(`world.cacheStatus.${world.cachedMesh.sizeWarning}` as TranslationKey)
                    : t("world.cacheStatus.ok")}
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

const DEFAULT_DIMENSION_OPTIONS: readonly {
  id: MinecraftDimensionId;
  label: string;
}[] = Object.freeze([
  { id: "overworld", label: "Overworld" },
  { id: "nether", label: "Nether" },
  { id: "end", label: "End" }
]);

function localizedDimensionLabel(
  t: (key: TranslationKey) => string,
  id: MinecraftDimensionId,
  fallback: string
): string {
  if (id === "overworld") return t("world.dimension.overworld");
  if (id === "nether") return t("world.dimension.nether");
  if (id === "end") return t("world.dimension.end");
  return fallback;
}

function formatByteEstimate(
  localization: ReturnType<typeof useLocalization>,
  bytes: number
): string {
  const mebibytes = bytes / (1024 * 1024);
  if (mebibytes >= 1024) {
    return `${localization.formatNumber(mebibytes / 1024, { maximumFractionDigits: 1 })} GiB`;
  }
  return `${localization.formatNumber(mebibytes, { maximumFractionDigits: 1 })} MiB`;
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
