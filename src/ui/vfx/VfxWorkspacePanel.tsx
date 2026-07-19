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

interface VfxWorkspacePanelProps {
  open: boolean;
  presets: readonly BuiltinVfxPreset[];
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

export function VfxWorkspacePanel({ open, presets, onClose }: VfxWorkspacePanelProps) {
  const nativePresets = useMemo(
    () => presets.filter((preset) => preset.metadata.compatibility.maturity === "stable" && preset.metadata.recipeId),
    [presets]
  );
  const [selectedPresetId, setSelectedPresetId] = useState(nativePresets[0]?.metadata.id ?? "");
  const [document, setDocument] = useState<VfxAuthoringDocument>(() => createBlankVfxAuthoringDocument());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [addKind, setAddKind] = useState<VfxAuthoringAddKind>("particle-emitter");
  const [message, setMessage] = useState("Blank declarative draft ready.");
  const [packageAuthor, setPackageAuthor] = useState("MineMotion Creator");
  const [packageLicense, setPackageLicense] = useState("CC0-1.0");
  const [inspection, setInspection] = useState<VfxPackageInspectionReport | null>(null);
  const packageInputRef = useRef<HTMLInputElement | null>(null);
  const compilation = useMemo(() => compileVfxAuthoringDocument(document), [document]);
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
      setMessage(result.errors.map((entry) => entry.message).join(" "));
      return;
    }
    setDocument(result.value.document);
    setSelectedItemId(result.value.selectedItemId);
    setMessage(result.value.changed ? result.value.historyLabel : "No VFX draft change.");
  };

  const deriveSelected = () => {
    const preset = nativePresets.find((candidate) => candidate.metadata.id === selectedPresetId);
    if (!preset) return setMessage("Choose a stable native built-in first.");
    try {
      const next = deriveVfxAuthoringDocumentFromBuiltin(preset);
      setDocument(next);
      setSelectedItemId(next.stack[0]?.id ?? null);
      setMessage(`Created a custom draft copy without changing ${preset.localizedName}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not derive the selected preset.");
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
      setMessage(`Exported deterministic package ${result.filename}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not export VFX package.");
    }
  };

  const inspectPackageFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const archive = await readVfxPackageArchive(await file.arrayBuffer());
      const report = inspectVfxPackage(archive);
      setInspection(report);
      setMessage(`Inspected ${report.displayName}. Nothing was installed or changed.`);
    } catch (error) {
      setInspection(null);
      setMessage(error instanceof Error ? error.message : "Could not inspect VFX package.");
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel vfx-workspace-panel" role="dialog" aria-modal="true" aria-label="VFX Workspace" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2><Sparkles size={18} /> VFX Workspace</h2>
          <button type="button" onClick={onClose} aria-label="Close VFX Workspace"><X size={16} /></button>
        </div>
        <div className="vfx-workspace-layout">
          <section className="vfx-workspace-source">
            <h3><WandSparkles size={15} /> Safe Draft Source</h3>
            <label>Stable native built-in
              <select value={selectedPresetId} onChange={(event) => setSelectedPresetId(event.target.value)}>
                {nativePresets.map((preset) => <option key={preset.metadata.id} value={preset.metadata.id}>{preset.localizedName}</option>)}
              </select>
            </label>
            <div className="stacked-actions">
              <button type="button" onClick={deriveSelected}>Derive Draft Copy</button>
              <button type="button" onClick={() => { setDocument(createBlankVfxAuthoringDocument()); setSelectedItemId(null); setMessage("Blank declarative draft ready."); }}>New Blank Draft</button>
            </div>
            <label>Package author<input value={packageAuthor} onChange={(event) => setPackageAuthor(event.target.value)} /></label>
            <label>SPDX license<input value={packageLicense} onChange={(event) => setPackageLicense(event.target.value)} /></label>
            <div className="stacked-actions">
              <button type="button" onClick={exportPackage}><Download size={14} /> Export .minemotion-vfx</button>
              <button type="button" onClick={() => packageInputRef.current?.click()}><Upload size={14} /> Inspect Package</button>
            </div>
            <p className="empty-note">{message}</p>
            <p className="vfx-safety-note">Declarative data only. JavaScript, executable plugins, and unrestricted shaders are not accepted.</p>
          </section>

          <section className="vfx-workspace-summary">
            <h3><CircleDot size={15} /> Draft Settings</h3>
            <label>Duration (frames)<input type="number" min={1} max={1_000_000} value={document.durationFrames} onChange={(event) => run({ type: "update-settings", patch: { durationFrames: Number(event.target.value) } })} /></label>
            <label>Target entity<input value={document.target?.entityId ?? ""} placeholder="Optional entity ID" onChange={(event) => run({ type: "update-settings", patch: { target: event.target.value ? { entityId: event.target.value, ...(document.target?.boneId ? { boneId: document.target.boneId } : {}) } : null } })} /></label>
            <label>Target bone<input value={document.target?.boneId ?? ""} placeholder="Optional bone ID" disabled={!document.target} onChange={(event) => document.target && run({ type: "update-settings", patch: { target: { entityId: document.target.entityId, ...(event.target.value ? { boneId: event.target.value } : {}) } } })} /></label>
            <label>Preview quality<select value={document.previewQuality} onChange={(event) => run({ type: "update-settings", patch: { previewQuality: event.target.value as VfxAuthoringDocument["previewQuality"] } })}>{["draft", "medium", "high", "final"].map((quality) => <option key={quality}>{quality}</option>)}</select></label>
            <label>Export quality<select value={document.exportQuality} onChange={(event) => run({ type: "update-settings", patch: { exportQuality: event.target.value as VfxAuthoringDocument["exportQuality"] } })}>{["draft", "medium", "high", "final"].map((quality) => <option key={quality}>{quality}</option>)}</select></label>
            {previewUrl && <img className="vfx-workspace-preview" src={previewUrl} alt={`Preview of ${document.displayName}`} />}
            <small className={compilation.ok ? "vfx-compile-ok" : "parameter-control-error"}>{compilation.ok ? `${compilation.value.descriptors.length} primitives / ${compilation.value.work.particles} particles / ${compilation.value.work.segments} segments` : compilation.errors.map((entry) => entry.message).join(" ")}</small>
          </section>

          <section className="vfx-workspace-editor">
            <h3><Box size={15} /> Item Editor</h3>
            {selectedItem ? <>
              <label>Label<input value={selectedItem.label} onChange={(event) => replaceSelected({ ...selectedItem, label: event.target.value })} /></label>
              {selectedItem.kind !== "modifier" && <label>Color<input type="color" value={selectedItem.descriptor.color.startsWith("#") ? selectedItem.descriptor.color : "#ffffff"} onChange={(event) => replaceSelected({ ...selectedItem, descriptor: { ...selectedItem.descriptor, color: event.target.value } } as VfxAuthoringStackItem)} /></label>}
              {selectedItem.kind === "modifier" && selectedItem.modifier.kind === "tint" && <label>Tint<input type="color" value={selectedItem.modifier.color} onChange={(event) => replaceSelected({ ...selectedItem, modifier: { kind: "tint", color: event.target.value } })} /></label>}
              {primaryValue(selectedItem) !== null && <label>Primary value<input type="number" min={0} step="any" value={primaryValue(selectedItem) ?? 0} onChange={(event) => replaceSelected(withPrimaryValue(selectedItem, Number(event.target.value)))} /></label>}
              <p className="empty-note">{selectedItem.kind === "modifier" ? `${selectedItem.modifier.kind} applies to all enabled items above it.` : selectedItem.descriptor.kind}</p>
            </> : <p className="empty-note">Select a stack item to edit it.</p>}
          </section>

          <section className="vfx-workspace-stack">
            <h3><Layers3 size={15} /> Stack ({document.stack.length}/16)</h3>
            <div className="vfx-stack-add"><select value={addKind} onChange={(event) => setAddKind(event.target.value as VfxAuthoringAddKind)}>{ADD_KINDS.map((kind) => <option key={kind}>{kind}</option>)}</select><button type="button" onClick={() => { const id = nextVfxAuthoringStackItemId(document, addKind); run({ type: "add", item: createDefaultVfxAuthoringStackItem(addKind, id) }); }}><Plus size={14} /> Add</button></div>
            <div className="vfx-stack-list" aria-label="VFX authoring stack">
              {document.stack.map((item, index) => <article key={item.id} className={`vfx-stack-item ${item.id === selectedItemId ? "selected" : ""}`}>
                {item.kind === "emitter" ? <CircleDot size={16} /> : item.kind === "primitive" ? <Box size={16} /> : <Layers3 size={16} />}
                <button type="button" className="vfx-stack-select" onClick={() => setSelectedItemId(item.id)}><strong>{index + 1}. {item.label}</strong><small>{item.kind === "modifier" ? item.modifier.kind : item.descriptor.kind}</small></button>
                <div className="vfx-stack-actions">
                  <button type="button" disabled={index === 0} aria-label={`Move ${item.label} up`} onClick={() => run({ type: "reorder", itemId: item.id, toIndex: index - 1 })}><ArrowUp size={13} /></button>
                  <button type="button" disabled={index === document.stack.length - 1} aria-label={`Move ${item.label} down`} onClick={() => run({ type: "reorder", itemId: item.id, toIndex: index + 1 })}><ArrowDown size={13} /></button>
                  <button type="button" aria-label={`Duplicate ${item.label}`} onClick={() => run({ type: "duplicate", itemId: item.id, newItemId: nextVfxAuthoringStackItemId(document, item.kind) })}><Copy size={13} /></button>
                  <button type="button" aria-label={`${item.enabled ? "Disable" : "Enable"} ${item.label}`} onClick={() => run({ type: "set-enabled", itemId: item.id, enabled: !item.enabled })}>{item.enabled ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                  <button type="button" aria-label={`Delete ${item.label}`} onClick={() => run({ type: "remove", itemId: item.id })}><Trash2 size={13} /></button>
                </div>
              </article>)}
              {document.stack.length === 0 && <p className="empty-note">Add a primitive, emitter, or restricted modifier.</p>}
            </div>
          </section>
          {inspection && <section className="vfx-package-report">
            <h3><ShieldCheck size={15} /> Pre-install Package Report</h3>
            <div className="vfx-package-report-grid">
              <img src={inspection.previewDataUrl} alt={`Package preview for ${inspection.displayName}`} />
              <dl>
                <div><dt>Package</dt><dd>{inspection.displayName} {inspection.packageVersion}</dd></div>
                <div><dt>Author / license</dt><dd>{inspection.author} / {inspection.license}</dd></div>
                <div><dt>Install readiness</dt><dd>{inspection.installReady ? "Ready" : "Missing required dependencies"}</dd></div>
                <div><dt>Runtime work</dt><dd>{inspection.primitiveCount} primitives / {inspection.particles} particles / {inspection.segments} segments</dd></div>
                <div><dt>Assets</dt><dd>{inspection.assetCount} / {inspection.assetBytes} bytes / {inspection.assetLicenses.join(", ") || "package license"}</dd></div>
              </dl>
            </div>
            <div className="vfx-package-report-lists">
              <div><strong>Dependencies</strong>{inspection.dependencies.length === 0 ? <span>None</span> : inspection.dependencies.map((dependency) => <span key={dependency.id}>{dependency.id} {dependency.versionRange}: {dependency.status}{dependency.optional ? " (optional)" : ""}</span>)}</div>
              <div><strong>Permissions</strong>{inspection.permissions.length === 0 ? <span>None</span> : inspection.permissions.map((permission) => <span key={permission.id}>{permission.id}: {permission.description}</span>)}</div>
            </div>
            <p className="vfx-safety-note">Inspection only. This package has not been installed, enabled, or written to local storage.</p>
          </section>}
        </div>
        <input ref={packageInputRef} className="hidden-input" type="file" accept=".minemotion-vfx,application/zip" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void inspectPackageFile(file); }} />
      </section>
    </div>
  );
}
