import {
  Archive,
  Download,
  FileJson,
  Film,
  Image,
  Package,
  Square,
  Volume2
} from "lucide-react";
import { collectProjectAssets } from "../../assets/library/AssetLibrary";
import { audioExportStatus, isAudioMixdownSupported } from "../../audio/export/AudioExportSupport";
import { EXPORT_PRESETS } from "../../export/ExportPresets";
import { validateExportSettings } from "../../export/ExportSettings";
import type {
  ExportFormat,
  ExportProgressState,
  ExportSettings
} from "../../export/ExportTypes";
import { isWebMExportSupported, mp4ExportStatus } from "../../export/VideoExporter";
import type { MineMotionProject } from "../../project/ProjectFile";

interface ExportPanelProps {
  open: boolean;
  project: MineMotionProject;
  progress: ExportProgressState;
  isExporting: boolean;
  onClose: () => void;
  onSettingsChange: (settings: ExportSettings) => void;
  onSavePackage: () => void;
  onExportLegacyProject: () => void;
  onExportCurrentFrame: () => void;
  onExportSequence: () => void;
  onExportWebM: () => void;
  onExportWav: () => void;
  onCancelExport: () => void;
}

export function ExportPanel({
  open,
  project,
  progress,
  isExporting,
  onClose,
  onSettingsChange,
  onSavePackage,
  onExportLegacyProject,
  onExportCurrentFrame,
  onExportSequence,
  onExportWebM,
  onExportWav,
  onCancelExport
}: ExportPanelProps) {
  if (!open) return null;

  const settings = project.exportSettings;
  const validation = validateExportSettings(settings, project);
  const assetLibrary = collectProjectAssets(project);
  const canRunVisualExport = validation.valid && !isExporting;
  const webmSupported = isWebMExportSupported();
  const audioSupported = isAudioMixdownSupported();

  const updateSettings = (patch: Partial<ExportSettings>) => {
    onSettingsChange({
      ...settings,
      ...patch
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel export-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Export"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Download size={18} />
            Export
          </h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="export-layout">
          <section>
            <h3>Output</h3>
            <label>
              Output name
              <input
                value={settings.outputName}
                onChange={(event) =>
                  updateSettings({ outputName: event.target.value })
                }
              />
            </label>
            <label>
              Format
              <select
                value={settings.format}
                onChange={(event) =>
                  updateSettings({ format: event.target.value as ExportFormat })
                }
              >
                <option value="png_frame">Current frame PNG</option>
                <option value="png_sequence">PNG sequence ZIP</option>
                <option value="webm_video">WebM video</option>
                <option value="wav_audio">WAV audio</option>
                <option value="audio_metadata">Audio metadata</option>
                <option value="mp4_video">MP4 video placeholder</option>
              </select>
            </label>
            <div className="export-grid-2">
              <NumberField
                label="Start frame"
                value={settings.startFrame}
                min={0}
                max={project.animation.durationFrames}
                onChange={(value) => updateSettings({ startFrame: value })}
              />
              <NumberField
                label="End frame"
                value={settings.endFrame}
                min={0}
                onChange={(value) => updateSettings({ endFrame: value })}
              />
              <NumberField
                label="FPS"
                value={settings.fps}
                min={1}
                max={120}
                onChange={(value) => updateSettings({ fps: value })}
              />
              <label>
                Quality
                <select
                  value={settings.quality}
                  onChange={(event) =>
                    updateSettings({
                      quality: event.target.value as ExportSettings["quality"]
                    })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <NumberField
                label="Width"
                value={settings.width}
                min={1}
                onChange={(value) => updateSettings({ width: value })}
              />
              <NumberField
                label="Height"
                value={settings.height}
                min={1}
                onChange={(value) => updateSettings({ height: value })}
              />
            </div>
            <label>
              Camera
              <select
                value={settings.cameraId}
                onChange={(event) => updateSettings({ cameraId: event.target.value })}
              >
                <option value="active">Active camera</option>
                <option value="viewport">Viewport camera</option>
                {project.scene.cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section>
            <h3>Render Options</h3>
            <CheckboxField
              label="Include post-processing"
              checked={settings.includePostProcessing}
              onChange={(value) =>
                updateSettings({ includePostProcessing: value })
              }
            />
            <CheckboxField
              label="Include cinematic VFX overlays"
              checked={settings.includeVfx}
              onChange={(value) => updateSettings({ includeVfx: value })}
            />
            <CheckboxField
              label="Include cinematic bars"
              checked={settings.includeCinematicBars}
              onChange={(value) =>
                updateSettings({ includeCinematicBars: value })
              }
            />
            <CheckboxField
              label="Transparent PNG background"
              checked={settings.transparentBackground}
              onChange={(value) =>
                updateSettings({ transparentBackground: value })
              }
            />
            <CheckboxField
              label="Include audio when video pipeline supports it"
              checked={settings.includeAudio}
              onChange={(value) => updateSettings({ includeAudio: value })}
            />
            <div className="export-presets">
              {EXPORT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => updateSettings(preset.settings)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3>Package</h3>
            <div className="export-actions">
              <button type="button" className="primary-action" onClick={onSavePackage}>
                <Package size={16} />
                Save .minemotion
              </button>
              <button type="button" onClick={onExportLegacyProject}>
                <FileJson size={16} />
                Export .mmsproj
              </button>
            </div>
            <div className="export-library">
              <strong>{assetLibrary.records.length} tracked assets</strong>
              <span>
                {assetLibrary.records.filter((asset) => asset.missing).length} missing
              </span>
              <span>{assetLibrary.warnings.length} package warnings</span>
            </div>
            <p className="empty-note">
              The .minemotion package embeds project JSON, OBJ assets, audio data
              URLs, manifest metadata, and an asset library index.
            </p>
          </section>

          <section>
            <h3>Run Export</h3>
            <div className="export-actions">
              <button
                type="button"
                disabled={!canRunVisualExport}
                onClick={onExportCurrentFrame}
              >
                <Image size={16} />
                PNG Frame
              </button>
              <button
                type="button"
                disabled={!canRunVisualExport}
                onClick={onExportSequence}
              >
                <Archive size={16} />
                PNG ZIP
              </button>
              <button
                type="button"
                disabled={!canRunVisualExport || !webmSupported}
                onClick={onExportWebM}
              >
                <Film size={16} />
                WebM
              </button>
              <button
                type="button"
                disabled={isExporting || !audioSupported}
                onClick={onExportWav}
              >
                <Volume2 size={16} />
                WAV
              </button>
              <button type="button" disabled={!isExporting} onClick={onCancelExport}>
                <Square size={16} />
                Cancel
              </button>
            </div>
            <StatusBlock
              validationErrors={validation.errors}
              validationWarnings={[
                ...validation.warnings,
                ...(webmSupported ? [] : [mp4ExportStatus()]),
                audioExportStatus()
              ]}
              progress={progress}
            />
          </section>
        </div>
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

function CheckboxField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function StatusBlock({
  validationErrors,
  validationWarnings,
  progress
}: {
  validationErrors: string[];
  validationWarnings: string[];
  progress: ExportProgressState;
}) {
  return (
    <div className="export-status">
      {validationErrors.length > 0 && (
        <ul className="export-errors">
          {validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      {validationWarnings.length > 0 && (
        <ul className="export-warnings">
          {validationWarnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <div className="export-progress">
        <strong>{progress.status}</strong>
        <span>{progress.message || "No export running."}</span>
        {progress.totalFrames > 0 && (
          <progress value={progress.currentFrame} max={progress.totalFrames} />
        )}
        {progress.error && <small>{progress.error}</small>}
      </div>
    </div>
  );
}
