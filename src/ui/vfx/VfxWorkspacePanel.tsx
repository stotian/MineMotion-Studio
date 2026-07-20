import {
  ArrowDown,
  ArrowUp,
  Box,
  CircleDot,
  Copy,
  Download,
  Eye,
  EyeOff,
  Layers3,
  Plus,
  Sparkles,
  ShieldCheck,
  Trash2,
  Upload,
  WandSparkles,
  X
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  applyVfxAuthoringCommand,
  createDefaultVfxAuthoringStackItem,
  nextVfxAuthoringStackItemId,
  type VfxAuthoringAddKind,
  type VfxAuthoringCommand
} from "../../vfx/authoring/VfxAuthoringController";
import { compileVfxAuthoringDocument } from "../../vfx/authoring/VfxAuthoringCompiler";
import {
  createBlankVfxAuthoringDocument,
  deriveVfxAuthoringDocumentFromBuiltin
} from "../../vfx/authoring/VfxAuthoringDocument";
import type {
  VfxAuthoringDocument,
  VfxAuthoringStackItem
} from "../../vfx/authoring/VfxAuthoringTypes";
import { generateVfxDescriptorPreviewDataUrl } from "../../vfx/library/VfxPresetPreviewCache";
import type { BuiltinVfxPreset } from "../../vfx/library/BuiltinVfxPresetTypes";
import { readVfxPackageArchive } from "../../vfx/package/VfxPackageArchiveReader";
import {
  createVfxPackageManifest,
  writeVfxPackageArchive
} from "../../vfx/package/VfxPackageArchiveWriter";
import {
  inspectVfxPackage,
  type VfxPackageInspectionReport
} from "../../vfx/package/VfxPackageInspection";
import {
  inspectInstalledVfxPackage,
  installVfxPackage,
  saveVfxPackageRegistry,
  setVfxPackageEnabled,
  uninstallVfxPackage,
  updateVfxPackage,
  type VfxPackageRegistry
} from "../../vfx/package/VfxPackageRegistry";
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";
import { formatLocalizedDiagnostic } from "../../localization/LocalizationDiagnostics";
import { resolveVfxPackagePresentation } from "../../vfx/package/VfxPackageLocalization";

interface VfxWorkspacePanelProps {
  open: boolean;
  presets: readonly BuiltinVfxPreset[];
  registry: VfxPackageRegistry;
  onRegistryChange: (registry: VfxPackageRegistry) => void;
  onClose: () => void;
}

const ADD_KINDS: readonly VfxAuthoringAddKind[] = [
  "particle-emitter",
  "beam",
  "trail",
  "expanding-ring",
  "light-pulse",
  "tint",
  "opacity",
  "scale"
];

function primaryValue(item: VfxAuthoringStackItem): number | null {
  if (item.kind === "modifier") return item.modifier.kind === "tint" ? null : item.modifier.multiplier;
  if (item.kind === "emitter") return item.descriptor.count;
  const descriptor = item.descriptor;
  if (descriptor.kind === "beam") return descriptor.subdivisions;
  if (descriptor.kind === "trail" || descriptor.kind === "expanding-ring") return descriptor.segments;
  return descriptor.peakIntensity;
}

function withPrimaryValue(item: VfxAuthoringStackItem, value: number): VfxAuthoringStackItem {
  if (item.kind === "modifier") {
    return item.modifier.kind === "tint" ? item : { ...item, modifier: { ...item.modifier, multiplier: value } };
  }
  if (item.kind === "emitter") return { ...item, descriptor: { ...item.descriptor, count: Math.round(value) } };
  const descriptor = item.descriptor;
  if (descriptor.kind === "beam") return { ...item, descriptor: { ...descriptor, subdivisions: Math.round(value) } };
  if (descriptor.kind === "trail" || descriptor.kind === "expanding-ring") return { ...item, descriptor: { ...descriptor, segments: Math.round(value) } };
  return { ...item, descriptor: { ...descriptor, peakIntensity: value } };
}

export function VfxWorkspacePanel({ open, presets, registry, onRegistryChange, onClose }: VfxWorkspacePanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const nativePresets = useMemo(
    () => presets.filter((preset) => preset.metadata.compatibility.maturity === "stable" && preset.metadata.recipeId),
    [presets]
  );
  const [selectedPresetId, setSelectedPresetId] = useState(nativePresets[0]?.metadata.id ?? "");
  const [document, setDocument] = useState<VfxAuthoringDocument>(() => createBlankVfxAuthoringDocument());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [addKind, setAddKind] = useState<VfxAuthoringAddKind>("particle-emitter");
  const [message, setMessage] = useState(() => t("vfx.message.blank"));
  const [packageAuthor, setPackageAuthor] = useState("MineMotion Creator");
  const [packageLicense, setPackageLicense] = useState("CC0-1.0");
  const [inspection, setInspection] = useState<VfxPackageInspectionReport | null>(null);
  const [inspectedBytes, setInspectedBytes] = useState<ArrayBuffer | null>(null);
  const packageInputRef = useRef<HTMLInputElement | null>(null);
  const compilation = useMemo(() => compileVfxAuthoringDocument(document), [document]);
  const installedPresentations = useMemo(
    () => new Map(registry.packages.map((entry) => [
      entry.id,
      resolveVfxPackagePresentation(entry.archive, localization.language)
    ])),
    [localization.language, registry.packages]
  );
  const previewUrl = useMemo(
    () => compilation.ok
      ? generateVfxDescriptorPreviewDataUrl(compilation.value.descriptors, document.displayName, document.id)
      : null,
    [compilation, document.displayName, document.id]
  );
  const selectedItem = document.stack.find((item) => item.id === selectedItemId) ?? null;

  if (!open) return null;

  const run = (command: VfxAuthoringCommand) => {
    const result = applyVfxAuthoringCommand(document, command);
    if (!result.ok) {
      setMessage(formatLocalizedDiagnostic(localization, "VFX_AUTHORING_INVALID", "vfx.message.authoringInvalid"));
      return;
    }
    setDocument(result.value.document);
    setSelectedItemId(result.value.selectedItemId);
    setMessage(result.value.changed ? result.value.historyLabel : t("vfx.message.noChange"));
  };

  const deriveSelected = () => {
    const preset = nativePresets.find((candidate) => candidate.metadata.id === selectedPresetId);
    if (!preset) return setMessage(t("vfx.message.chooseBuiltin"));
    try {
      const next = deriveVfxAuthoringDocumentFromBuiltin(preset);
      setDocument(next);
      setSelectedItemId(next.stack[0]?.id ?? null);
      setMessage(t("vfx.message.derived", { name: preset.localizedName }));
    } catch (error) {
      setMessage(formatLocalizedDiagnostic(localization, "VFX_DERIVE_FAILED", "vfx.message.deriveFailed"));
    }
  };

  const replaceSelected = (item: VfxAuthoringStackItem) => {
    if (selectedItem) run({ type: "replace-item", itemId: selectedItem.id, item });
  };

  const exportPackage = async () => {
    try {
      const manifest = createVfxPackageManifest(document, {
        author: packageAuthor,
        license: packageLicense
      });
      const result = await writeVfxPackageArchive({ manifest, document });
      const url = URL.createObjectURL(result.blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(t("vfx.message.exported", { filename: result.filename }));
    } catch (error) {
      setMessage(formatLocalizedDiagnostic(localization, "VFX_PACKAGE_EXPORT_FAILED", "vfx.message.exportFailed"));
    }
  };

  const inspectPackageFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const bytes = await file.arrayBuffer();
      const archive = await readVfxPackageArchive(bytes);
      const report = inspectVfxPackage(archive, [], localization.language);
      setInspection(report);
      setInspectedBytes(bytes);
      setMessage(t("vfx.message.inspected", { name: report.displayName }));
    } catch (error) {
      setInspection(null);
      setInspectedBytes(null);
      setMessage(formatLocalizedDiagnostic(localization, "VFX_PACKAGE_INSPECT_FAILED", "vfx.message.inspectFailed"));
    }
  };

  const persistRegistry = (next: VfxPackageRegistry, successMessage: string) => {
    if (!saveVfxPackageRegistry(window.localStorage, next)) {
      setMessage(t("vfx.message.storageFailed"));
      return;
    }
    onRegistryChange(next);
    setMessage(successMessage);
  };

  const installInspectedPackage = async () => {
    if (!inspection || !inspectedBytes) return;
    try {
      const exists = registry.packages.some((entry) => entry.id === inspection.packageId);
      const timestamp = new Date().toISOString();
      const next = exists
        ? await updateVfxPackage(registry, inspectedBytes, timestamp)
        : await installVfxPackage(registry, inspectedBytes, timestamp);
      persistRegistry(next, t(exists ? "vfx.message.updated" : "vfx.message.installed", { name: inspection.displayName }));
    } catch (error) {
      setMessage(formatLocalizedDiagnostic(localization, "VFX_PACKAGE_INSTALL_FAILED", "vfx.message.installFailed"));
    }
  };

  const toggleInstalledPackage = (packageId: string, enabled: boolean) => {
    try {
      persistRegistry(setVfxPackageEnabled(registry, packageId, enabled), t("vfx.message.state", {
        id: packageId,
        state: t(enabled ? "common.enabled" : "common.disabled")
      }));
    } catch (error) {
      setMessage(formatLocalizedDiagnostic(localization, "VFX_PACKAGE_STATE_FAILED", "vfx.message.stateFailed"));
    }
  };

  const removeInstalledPackage = (packageId: string) => {
    if (!window.confirm(t("vfx.message.confirmUninstall", { id: packageId }))) return;
    try {
      persistRegistry(uninstallVfxPackage(registry, packageId), t("vfx.message.uninstalled", { id: packageId }));
    } catch (error) {
      setMessage(formatLocalizedDiagnostic(localization, "VFX_PACKAGE_UNINSTALL_FAILED", "vfx.message.uninstallFailed"));
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel vfx-workspace-panel" role="dialog" aria-modal="true" aria-label={t("vfx.title")} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2><Sparkles size={18} /> {t("vfx.title")}</h2>
          <button type="button" onClick={onClose} aria-label={t("vfx.closeAria")}><X size={16} /></button>
        </div>
        <div className="vfx-workspace-layout">
          <section className="vfx-workspace-source">
            <h3><WandSparkles size={15} /> {t("vfx.safeSource")}</h3>
            <label>{t("vfx.stableBuiltin")}
              <select value={selectedPresetId} onChange={(event) => setSelectedPresetId(event.target.value)}>
                {nativePresets.map((preset) => <option key={preset.metadata.id} value={preset.metadata.id}>{preset.localizedName}</option>)}
              </select>
            </label>
            <div className="stacked-actions">
              <button type="button" onClick={deriveSelected}>{t("vfx.derive")}</button>
              <button type="button" onClick={() => { setDocument(createBlankVfxAuthoringDocument()); setSelectedItemId(null); setMessage(t("vfx.message.blank")); }}>{t("vfx.newBlank")}</button>
            </div>
            <label>{t("vfx.packageAuthor")}<input value={packageAuthor} onChange={(event) => setPackageAuthor(event.target.value)} /></label>
            <label>{t("vfx.license")}<input value={packageLicense} onChange={(event) => setPackageLicense(event.target.value)} /></label>
            <div className="stacked-actions">
              <button type="button" onClick={exportPackage}><Download size={14} /> {t("vfx.exportPackage")}</button>
              <button type="button" onClick={() => packageInputRef.current?.click()}><Upload size={14} /> {t("vfx.inspectPackage")}</button>
            </div>
            <p className="empty-note">{message}</p>
            <p className="vfx-safety-note">{t("vfx.safety")}</p>
          </section>

          <section className="vfx-workspace-summary">
            <h3><CircleDot size={15} /> {t("vfx.draftSettings")}</h3>
            <label>{t("vfx.durationFrames")}<input type="number" min={1} max={1_000_000} value={document.durationFrames} onChange={(event) => run({ type: "update-settings", patch: { durationFrames: Number(event.target.value) } })} /></label>
            <label>{t("vfx.targetEntity")}<input value={document.target?.entityId ?? ""} placeholder={t("vfx.targetEntityPlaceholder")} onChange={(event) => run({ type: "update-settings", patch: { target: event.target.value ? { entityId: event.target.value, ...(document.target?.boneId ? { boneId: document.target.boneId } : {}) } : null } })} /></label>
            <label>{t("vfx.targetBone")}<input value={document.target?.boneId ?? ""} placeholder={t("vfx.targetBonePlaceholder")} disabled={!document.target} onChange={(event) => document.target && run({ type: "update-settings", patch: { target: { entityId: document.target.entityId, ...(event.target.value ? { boneId: event.target.value } : {}) } } })} /></label>
            <label>{t("vfx.previewQuality")}<select value={document.previewQuality} onChange={(event) => run({ type: "update-settings", patch: { previewQuality: event.target.value as VfxAuthoringDocument["previewQuality"] } })}>{["draft", "medium", "high", "final"].map((quality) => <option key={quality} value={quality}>{t(`vfx.quality.${quality}` as TranslationKey)}</option>)}</select></label>
            <label>{t("vfx.exportQuality")}<select value={document.exportQuality} onChange={(event) => run({ type: "update-settings", patch: { exportQuality: event.target.value as VfxAuthoringDocument["exportQuality"] } })}>{["draft", "medium", "high", "final"].map((quality) => <option key={quality} value={quality}>{t(`vfx.quality.${quality}` as TranslationKey)}</option>)}</select></label>
            {previewUrl && <img className="vfx-workspace-preview" src={previewUrl} alt={t("vfx.previewAlt", { name: document.displayName })} />}
            <small className={compilation.ok ? "vfx-compile-ok" : "parameter-control-error"}>{compilation.ok ? t("vfx.work", { primitives: compilation.value.descriptors.length, particles: compilation.value.work.particles, segments: compilation.value.work.segments }) : formatLocalizedDiagnostic(localization, "VFX_PACKAGE_COMPILE_FAILED", "vfx.message.compileFailed")}</small>
          </section>

          <section className="vfx-workspace-editor">
            <h3><Box size={15} /> {t("vfx.itemEditor")}</h3>
            {selectedItem ? <>
              <label>{t("vfx.label")}<input value={selectedItem.label} onChange={(event) => replaceSelected({ ...selectedItem, label: event.target.value })} /></label>
              {selectedItem.kind !== "modifier" && <label>{t("vfx.color")}<input type="color" value={selectedItem.descriptor.color.startsWith("#") ? selectedItem.descriptor.color : "#ffffff"} onChange={(event) => replaceSelected({ ...selectedItem, descriptor: { ...selectedItem.descriptor, color: event.target.value } } as VfxAuthoringStackItem)} /></label>}
              {selectedItem.kind === "modifier" && selectedItem.modifier.kind === "tint" && <label>{t("vfx.tint")}<input type="color" value={selectedItem.modifier.color} onChange={(event) => replaceSelected({ ...selectedItem, modifier: { kind: "tint", color: event.target.value } })} /></label>}
              {primaryValue(selectedItem) !== null && <label>{t("vfx.primaryValue")}<input type="number" min={0} step="any" value={primaryValue(selectedItem) ?? 0} onChange={(event) => replaceSelected(withPrimaryValue(selectedItem, Number(event.target.value)))} /></label>}
              <p className="empty-note">{selectedItem.kind === "modifier" ? t("vfx.modifierScope", { kind: selectedItem.modifier.kind }) : selectedItem.descriptor.kind}</p>
            </> : <p className="empty-note">{t("vfx.selectItem")}</p>}
          </section>

          <section className="vfx-workspace-stack">
            <h3><Layers3 size={15} /> {t("vfx.stack", { count: document.stack.length })}</h3>
            <div className="vfx-stack-add"><select value={addKind} onChange={(event) => setAddKind(event.target.value as VfxAuthoringAddKind)}>{ADD_KINDS.map((kind) => <option key={kind}>{kind}</option>)}</select><button type="button" onClick={() => { const id = nextVfxAuthoringStackItemId(document, addKind); run({ type: "add", item: createDefaultVfxAuthoringStackItem(addKind, id) }); }}><Plus size={14} /> {t("vfx.add")}</button></div>
            <div className="vfx-stack-list" aria-label={t("vfx.stackAria")}>
              {document.stack.map((item, index) => <article key={item.id} className={`vfx-stack-item ${item.id === selectedItemId ? "selected" : ""}`}>
                {item.kind === "emitter" ? <CircleDot size={16} /> : item.kind === "primitive" ? <Box size={16} /> : <Layers3 size={16} />}
                <button type="button" className="vfx-stack-select" onClick={() => setSelectedItemId(item.id)}><strong>{index + 1}. {item.label}</strong><small>{item.kind === "modifier" ? item.modifier.kind : item.descriptor.kind}</small></button>
                <div className="vfx-stack-actions">
                  <button type="button" disabled={index === 0} aria-label={t("vfx.moveUp", { name: item.label })} onClick={() => run({ type: "reorder", itemId: item.id, toIndex: index - 1 })}><ArrowUp size={13} /></button>
                  <button type="button" disabled={index === document.stack.length - 1} aria-label={t("vfx.moveDown", { name: item.label })} onClick={() => run({ type: "reorder", itemId: item.id, toIndex: index + 1 })}><ArrowDown size={13} /></button>
                  <button type="button" aria-label={t("vfx.duplicate", { name: item.label })} onClick={() => run({ type: "duplicate", itemId: item.id, newItemId: nextVfxAuthoringStackItemId(document, item.kind) })}><Copy size={13} /></button>
                  <button type="button" aria-label={t(item.enabled ? "vfx.disable" : "vfx.enable", { name: item.label })} onClick={() => run({ type: "set-enabled", itemId: item.id, enabled: !item.enabled })}>{item.enabled ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                  <button type="button" aria-label={t("vfx.delete", { name: item.label })} onClick={() => run({ type: "remove", itemId: item.id })}><Trash2 size={13} /></button>
                </div>
              </article>)}
              {document.stack.length === 0 && <p className="empty-note">{t("vfx.emptyStack")}</p>}
            </div>
          </section>
          {inspection && <section className="vfx-package-report">
            <h3><ShieldCheck size={15} /> {t("vfx.report")}</h3>
            <div className="vfx-package-report-grid">
              <img src={inspection.previewDataUrl} alt={t("vfx.packagePreviewAlt", { name: inspection.displayName })} />
              <dl>
                <div><dt>{t("vfx.package")}</dt><dd>{inspection.displayName} {inspection.packageVersion}</dd></div>
                <div><dt>{t("vfx.authorLicense")}</dt><dd>{inspection.author} / {inspection.license}</dd></div>
                <div><dt>{t("vfx.installReadiness")}</dt><dd>{t(inspection.installReady ? "vfx.ready" : "vfx.missingDependencies")}</dd></div>
                <div><dt>{t("vfx.runtimeWork")}</dt><dd>{t("vfx.work", { primitives: inspection.primitiveCount, particles: inspection.particles, segments: inspection.segments })}</dd></div>
                <div><dt>{t("vfx.assets")}</dt><dd>{inspection.assetCount} / {inspection.assetBytes} bytes / {inspection.assetLicenses.join(", ") || t("vfx.packageLicense")}</dd></div>
              </dl>
            </div>
            <div className="vfx-package-report-lists">
              <div><strong>{t("vfx.dependencies")}</strong>{inspection.dependencies.length === 0 ? <span>{t("common.none")}</span> : inspection.dependencies.map((dependency) => <span key={dependency.id}>{dependency.id} {dependency.versionRange}: {t(`vfx.dependency.${dependency.status}` as TranslationKey)}{dependency.optional ? ` (${t("vfx.optional")})` : ""}</span>)}</div>
              <div><strong>{t("vfx.permissions")}</strong>{inspection.permissions.length === 0 ? <span>{t("common.none")}</span> : inspection.permissions.map((permission) => <span key={permission.id}>{permission.id}: {t(`vfx.permission.${permission.id}` as TranslationKey)}</span>)}</div>
            </div>
            <p className="vfx-safety-note">{t(inspectedBytes ? "vfx.inspectionOnly" : "vfx.installedInspection")}</p>
            <button type="button" disabled={!inspection.installReady || !inspectedBytes} onClick={() => void installInspectedPackage()}>
              <ShieldCheck size={14} /> {t(registry.packages.some((entry) => entry.id === inspection.packageId) ? "vfx.updateInstalled" : "vfx.installLocally")}
            </button>
          </section>}
          <section className="vfx-installed-packages">
            <h3><ShieldCheck size={15} /> {t("vfx.installedPackages", { count: registry.packages.length })}</h3>
            <div className="vfx-installed-list">
              {registry.packages.map((entry) => <article key={entry.id}>
                <span><strong>{installedPresentations.get(entry.id)?.displayName ?? entry.archive.manifest.displayName}</strong><small>{entry.id} / {entry.version} / {t(entry.enabled ? "common.enabled" : "common.disabled")}</small></span>
                <div>
                  <button type="button" onClick={() => { setInspection(inspectInstalledVfxPackage(registry, entry.id, localization.language)); setInspectedBytes(null); setMessage(t("vfx.message.inspectingInstalled", { id: entry.id })); }}>{t("vfx.inspect")}</button>
                  <button type="button" onClick={() => toggleInstalledPackage(entry.id, !entry.enabled)}>{t(entry.enabled ? "vfx.disableAction" : "vfx.enableAction")}</button>
                  <button type="button" onClick={() => removeInstalledPackage(entry.id)}>{t("vfx.uninstall")}</button>
                </div>
              </article>)}
              {registry.packages.length === 0 && <p className="empty-note">{t("vfx.noInstalled")}</p>}
            </div>
          </section>
        </div>
        <input ref={packageInputRef} className="hidden-input" type="file" accept=".minemotion-vfx,application/zip" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void inspectPackageFile(file); }} />
      </section>
    </div>
  );
}
