import { useEffect, useMemo, useRef, useState } from "react";
import { Grid2X2, Heart, List, PackageSearch, RefreshCw, Search, Trash2, X } from "lucide-react";
import type { MineMotionProject } from "../../project/ProjectFile";
import { collectProjectAssets } from "../../assets/library/AssetLibrary";
import { DEFAULT_ASSET_QUERY, queryAssets, type AssetViewMode } from "../../assets/library/AssetQuery";
import { groupDuplicateAssets } from "../../assets/library/AssetHash";
import { inspectAssetDependencies } from "../../assets/library/AssetDependencyInspector";
import { previewUnusedAssetCleanup } from "../../assets/library/AssetCleanup";
import { removeUnusedProjectAssets } from "../../assets/library/AssetProjectCleanup";
import { setAssetFavorite } from "../../assets/library/AssetCatalog";
import { validateAssetImportBatch } from "../../assets/library/AssetImportPolicy";
import { generateThumbnailsBounded } from "../../assets/library/AssetThumbnail";
import { useLocalization } from "../../localization/LocalizationContext";

interface AssetLibraryPanelProps {
  open: boolean;
  project: MineMotionProject;
  onProjectChange: (project: MineMotionProject) => void;
  onClose: () => void;
}

export function AssetLibraryPanel({ open, project, onProjectChange, onClose }: AssetLibraryPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [view, setView] = useState<AssetViewMode>("grid");
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [missingOnly, setMissingOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const inputRef = useRef<HTMLInputElement | null>(null);
  const library = useMemo(() => collectProjectAssets(project), [project]);
  const visible = useMemo(() => queryAssets(library, {
    ...DEFAULT_ASSET_QUERY,
    search,
    favoritesOnly,
    missingOnly
  }), [favoritesOnly, library, missingOnly, search]);
  const dependencies = useMemo(() => inspectAssetDependencies(library), [library]);
  const cleanup = useMemo(() => previewUnusedAssetCleanup(library), [library]);
  const duplicates = useMemo(() => groupDuplicateAssets(library.records), [library.records]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void generateThumbnailsBounded(library.records.map((asset) => ({
      assetId: asset.id,
      name: asset.name,
      type: asset.type,
      sourceDataUrl: asset.thumbnail?.dataUrl
    }))).then((result) => {
      if (cancelled) return;
      setThumbnails(new Map([...result].flatMap(([id, thumbnail]) => thumbnail.dataUrl ? [[id, thumbnail.dataUrl]] : [])));
    });
    return () => { cancelled = true; };
  }, [library.records, open]);

  if (!open) return null;

  const updateLibrary = (nextLibrary: MineMotionProject["assetLibrary"]) => {
    onProjectChange({ ...project, assetLibrary: nextLibrary, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } });
  };
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const report = validateAssetImportBatch([...files].map((file) => ({
      name: file.name, size: file.size, type: file.type, lastModified: file.lastModified
    })));
    setImportMessage(t("assets.importReport", { accepted: report.accepted.length, rejected: report.rejected.length }));
  };
  const toggleSelection = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const removeSelected = () => {
    const next = removeUnusedProjectAssets(project, selectedIds);
    onProjectChange(next);
    setSelectedIds([]);
  };

  return (
    <div className="modal-backdrop">
      <section className="modal-panel asset-library-panel" role="dialog" aria-modal="true" aria-labelledby="asset-library-title">
        <header className="panel-header">
          <div><h2 id="asset-library-title">{t("assets.title")}</h2><p>{t("assets.subtitle")}</p></div>
          <button type="button" onClick={onClose} aria-label={t("common.close")}><X size={18} /></button>
        </header>
        <div className="asset-library-toolbar">
          <label className="asset-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("assets.search")} /></label>
          <button type="button" className={favoritesOnly ? "is-active" : ""} onClick={() => setFavoritesOnly((value) => !value)}><Heart size={15} />{t("assets.favorites")}</button>
          <button type="button" className={missingOnly ? "is-active" : ""} onClick={() => setMissingOnly((value) => !value)}><RefreshCw size={15} />{t("assets.missing")}</button>
          <button type="button" onClick={() => setView("grid")} aria-pressed={view === "grid"}><Grid2X2 size={15} /></button>
          <button type="button" onClick={() => setView("list")} aria-pressed={view === "list"}><List size={15} /></button>
          <button type="button" onClick={() => inputRef.current?.click()}><PackageSearch size={15} />{t("assets.inspectImport")}</button>
          <input ref={inputRef} hidden multiple type="file" onChange={(event) => handleFiles(event.target.files)} />
        </div>
        {importMessage ? <p className="inline-notice">{importMessage}</p> : null}
        <div className={`asset-library-results asset-view-${view}`}>
          {visible.map((asset) => (
            <article key={asset.id} className={`asset-card ${selectedIds.includes(asset.id) ? "is-selected" : ""}`} onClick={() => toggleSelection(asset.id)}>
              <div className="asset-thumbnail">{thumbnails.get(asset.id) ? <img src={thumbnails.get(asset.id)} alt="" /> : <span>{asset.type}</span>}</div>
              <div className="asset-card-copy"><strong>{asset.name}</strong><span>{asset.type} · {localization.formatNumber(asset.sizeBytes)} B</span><small>{asset.storagePolicy} · {asset.integrity.status} · {asset.references.length} ref.</small></div>
              <button type="button" className={asset.favorite ? "is-active" : ""} aria-label={t("assets.toggleFavorite")} onClick={(event) => { event.stopPropagation(); updateLibrary(setAssetFavorite(library, asset.id, !asset.favorite)); }}><Heart size={14} /></button>
            </article>
          ))}
        </div>
        <footer className="asset-library-summary">
          <span>{t("assets.summary", { count: library.records.length, bytes: dependencies.packageBytes })}</span>
          <span>{t("assets.health", { missing: dependencies.missing.length, external: dependencies.external.length, duplicates: duplicates.length })}</span>
          <button type="button" disabled={selectedIds.length === 0 || !selectedIds.every((id) => cleanup.removable.some((asset) => asset.id === id))} onClick={removeSelected}><Trash2 size={15} />{t("assets.removeUnused", { count: selectedIds.length })}</button>
        </footer>
      </section>
    </div>
  );
}
