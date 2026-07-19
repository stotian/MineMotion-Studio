import { Box, CircleDot, Layers3, Sparkles, WandSparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  createBlankVfxAuthoringDocument,
  deriveVfxAuthoringDocumentFromBuiltin
} from "../../vfx/authoring/VfxAuthoringDocument";
import type { VfxAuthoringDocument } from "../../vfx/authoring/VfxAuthoringTypes";
import type { BuiltinVfxPreset } from "../../vfx/library/BuiltinVfxPresetTypes";

interface VfxWorkspacePanelProps {
  open: boolean;
  presets: readonly BuiltinVfxPreset[];
  onClose: () => void;
}

export function VfxWorkspacePanel({ open, presets, onClose }: VfxWorkspacePanelProps) {
  const nativePresets = useMemo(
    () => presets.filter((preset) => preset.metadata.compatibility.maturity === "stable" && preset.metadata.recipeId),
    [presets]
  );
  const [selectedPresetId, setSelectedPresetId] = useState(nativePresets[0]?.metadata.id ?? "");
  const [document, setDocument] = useState<VfxAuthoringDocument>(() => createBlankVfxAuthoringDocument());
  const [message, setMessage] = useState("Blank declarative draft ready.");

  if (!open) return null;

  const deriveSelected = () => {
    const preset = nativePresets.find((candidate) => candidate.metadata.id === selectedPresetId);
    if (!preset) {
      setMessage("Choose a stable native built-in first.");
      return;
    }
    try {
      setDocument(deriveVfxAuthoringDocumentFromBuiltin(preset));
      setMessage(`Created a custom draft copy without changing ${preset.localizedName}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not derive the selected preset.");
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel vfx-workspace-panel"
        role="dialog"
        aria-modal="true"
        aria-label="VFX Workspace"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2><Sparkles size={18} /> VFX Workspace</h2>
          <button type="button" onClick={onClose} aria-label="Close VFX Workspace"><X size={16} /></button>
        </div>
        <div className="vfx-workspace-layout">
          <section className="vfx-workspace-source">
            <h3><WandSparkles size={15} /> Safe Draft Source</h3>
            <label>
              Stable native built-in
              <select value={selectedPresetId} onChange={(event) => setSelectedPresetId(event.target.value)}>
                {nativePresets.map((preset) => (
                  <option key={preset.metadata.id} value={preset.metadata.id}>{preset.localizedName}</option>
                ))}
              </select>
            </label>
            <div className="stacked-actions">
              <button type="button" onClick={deriveSelected}>Derive Draft Copy</button>
              <button
                type="button"
                onClick={() => {
                  setDocument(createBlankVfxAuthoringDocument());
                  setMessage("Blank declarative draft ready.");
                }}
              >
                New Blank Draft
              </button>
            </div>
            <p className="empty-note">{message}</p>
            <p className="vfx-safety-note">
              Declarative data only. JavaScript, executable plugins, and unrestricted shaders are not accepted.
            </p>
          </section>

          <section className="vfx-workspace-summary">
            <h3><CircleDot size={15} /> Draft Settings</h3>
            <dl>
              <div><dt>Name</dt><dd>{document.displayName}</dd></div>
              <div><dt>Source</dt><dd>{document.source.kind === "blank" ? "Blank custom" : "Derived built-in"}</dd></div>
              <div><dt>Duration</dt><dd>{document.durationFrames} frames</dd></div>
              <div><dt>Space / layer</dt><dd>{document.space} / {document.renderLayer}</dd></div>
              <div><dt>Quality</dt><dd>{document.previewQuality} / {document.exportQuality}</dd></div>
              <div><dt>Target</dt><dd>{document.target?.boneId ?? document.target?.entityId ?? "None"}</dd></div>
            </dl>
          </section>

          <section className="vfx-workspace-stack">
            <h3><Layers3 size={15} /> Stack ({document.stack.length}/16)</h3>
            <div className="vfx-stack-list" aria-label="VFX authoring stack">
              {document.stack.map((item, index) => (
                <article key={item.id} className="vfx-stack-item">
                  {item.kind === "emitter" ? <CircleDot size={16} /> : item.kind === "primitive" ? <Box size={16} /> : <Layers3 size={16} />}
                  <span><strong>{index + 1}. {item.label}</strong><small>{item.kind === "modifier" ? item.modifier.kind : item.descriptor.kind}</small></span>
                  <em>{item.enabled ? "Enabled" : "Disabled"}</em>
                </article>
              ))}
              {document.stack.length === 0 && (
                <p className="empty-note">This draft has no stack items yet. Stack editing is enabled in the next authoring milestone.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
