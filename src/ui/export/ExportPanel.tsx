import {
  Archive,
  CheckCircle2,
  Download,
  FileJson,
  Film,
  HardDrive,
  Image,
  Package,
  Plus,
  RefreshCw,
  Square,
  Volume2,
  XCircle
} from "lucide-react";
import { collectProjectAssets } from "../../assets/library/AssetLibrary";
import {
  audioExportStatus,
  isAudioMixdownSupported
} from "../../audio/export/AudioExportSupport";
import { EXPORT_PRESETS } from "../../export/ExportPresets";
import { validateExportSettings } from "../../export/ExportSettings";
import type {
  ExportEstimate,
  ExportFormat,
  ExportProgressState,
  ExportSettings,
  ExportValidationChecklist
} from "../../export/ExportTypes";
import type { FfmpegDetectionResult } from "../../export/ffmpeg/FfmpegDetector";
import type { FfmpegSettings } from "../../export/ffmpeg/FfmpegSettings";
import { RenderQueuePanel } from "../../export/renderQueue/RenderQueuePanel";
import { isWebMExportSupported } from "../../export/VideoExporter";
import type { MineMotionProject } from "../../project/ProjectFile";

interface ExportPanelProps {
  open: boolean;
  project: MineMotionProject;
  progress: ExportProgressState;
  isExporting: boolean;
  ffmpegDetection: FfmpegDetectionResult;
  onClose: () => void;
  onSettingsChange: (settings: ExportSettings) => void;
  onFfmpegSettingsChange: (settings: FfmpegSettings) => void;
  onDetectFfmpeg: () => void;
  onAddRenderJob: () => void;
  onRunRenderJob: (jobId: string) => void;
  onRemoveRenderJob: (jobId: string) => void;
  onClearFinishedRenderJobs: () => void;
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
  ffmpegDetection,
  onClose,
  onSettingsChange,
  onFfmpegSettingsChange,
  onDetectFfmpeg,
  onAddRenderJob,
  onRunRenderJob,
  onRemoveRenderJob,
  onClearFinishedRenderJobs,
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
  const validation = validateExportSettings(settings, project, {
    ffmpegAvailable: ffmpegDetection.available,
    ffmpegOutputDirectory: project.ffmpegSettings.outputDirectory
  });
  const assetLibrary = collectProjectAssets(project);
  const canRunVisualExport = validation.valid && !isExporting;
  const webmSupported = isWebMExportSupported();
  const audioSupported = isAudioMixdownSupported();

  const updateSettings = (patch: Partial<ExportSettings>) => {
    onSettingsChange({ ...settings, ...patch });
  };
  const updateFfmpegSettings = (patch: Partial<FfmpegSettings>) => {
    onFfmpegSettingsChange({ ...project.ffmpegSettings, ...patch });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel export-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Production export"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Download size={18} />
            Production Export
          </h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <div className="export-layout">
          <section>
            <h3>Output</h3>
            <label>
              Output name
              <input
                value={settings.outputName}
                onChange={(event) => updateSettings({ outputName: event.target.value })}
              />
            </label>
            <label>
              Format
              <select
                value={settings.format}
                onChange={(event) => updateSettings({ format: event.target.value as ExportFormat })}
              >
                <optgroup label="Browser and desktop">
                  <option value="png_frame">PNG current frame</option>
                  <option value="png_sequence">PNG sequence ZIP</option>
                  <option value="webm_video">WebM video (video only)</option>
                  <option value="wav_audio">WAV audio mixdown</option>
                  <option value="minemotion_package">.minemotion package</option>
                  <option value="audio_metadata">Audio metadata JSON</option>
                </optgroup>
                <optgroup label="Desktop + user-installed FFmpeg">
                  <option value="mp4_h264">MP4 H.264</option>
                  <option value="mp4_h265">MP4 H.265</option>
                  <option value="prores_video">ProRes MOV</option>
                  <option value="mp3_audio">MP3 audio</option>
                </optgroup>
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
                  onChange={(event) => updateSettings({ quality: event.target.value as ExportSettings["quality"] })}
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
                  <option key={camera.id} value={camera.id}>{camera.name}</option>
                ))}
              </select>
            </label>
          </section>

          <section>
            <h3>Render Options</h3>
            <CheckboxField
              label="Include post-processing"
              checked={settings.includePostProcessing}
              onChange={(value) => updateSettings({ includePostProcessing: value })}
            />
            <CheckboxField
              label="Include cinematic VFX overlays"
              checked={settings.includeVfx}
              onChange={(value) => updateSettings({ includeVfx: value })}
            />
            <CheckboxField
              label="Include cinematic bars"
              checked={settings.includeCinematicBars}
              onChange={(value) => updateSettings({ includeCinematicBars: value })}
            />
            <CheckboxField
              label="Transparent PNG background"
              checked={settings.transparentBackground}
              onChange={(value) => updateSettings({ transparentBackground: value })}
            />
            <CheckboxField
              label="Include audio where the selected format supports it"
              checked={settings.includeAudio}
              onChange={(value) => updateSettings({ includeAudio: value })}
            />
            <div className="export-presets">
              {EXPORT_PRESETS.map((preset) => (
                <button key={preset.id} type="button" onClick={() => updateSettings(preset.settings)}>
                  {preset.name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3><HardDrive size={16} /> FFmpeg Desktop</h3>
            <label>
              FFmpeg executable or path
              <input
                value={project.ffmpegSettings.executablePath}
                onChange={(event) => updateFfmpegSettings({ executablePath: event.target.value })}
                placeholder="ffmpeg or C:\\ffmpeg\\bin\\ffmpeg.exe"
              />
            </label>
            <label>
              Native output directory
              <input
                value={project.ffmpegSettings.outputDirectory}
                onChange={(event) => updateFfmpegSettings({ outputDirectory: event.target.value })}
                placeholder="C:\\Users\\you\\Videos"
              />
            </label>
            <label>
              Encoding target
              <select
                value={project.ffmpegSettings.videoQuality}
                onChange={(event) => updateFfmpegSettings({
                  videoQuality: event.target.value as FfmpegSettings["videoQuality"]
                })}
              >
                <option value="small">Smaller file</option>
                <option value="balanced">Balanced</option>
                <option value="high">High quality</option>
              </select>
            </label>
            <CheckboxField
              label="Overwrite existing output"
              checked={project.ffmpegSettings.overwriteExisting}
              onChange={(value) => updateFfmpegSettings({ overwriteExisting: value })}
            />
            <div className="ffmpeg-status">
              {ffmpegDetection.available ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{ffmpegDetection.message}</span>
            </div>
            <button type="button" onClick={onDetectFfmpeg} disabled={isExporting}>
              <RefreshCw size={15} />
              Detect FFmpeg
            </button>
          </section>

          <section>
            <h3>Validation</h3>
            <ValidationChecklist checklist={validation.checklist} />
            {validation.estimates && <EstimateBlock estimate={validation.estimates} />}
            <StatusBlock
              validationErrors={validation.errors}
              validationWarnings={[
                ...validation.warnings,
                ...(webmSupported ? [] : ["WebM is unavailable in this runtime."]),
                ...(audioSupported ? [] : [audioExportStatus()])
              ]}
              progress={progress}
            />
          </section>

          <section>
            <h3>Run or Package</h3>
            <div className="export-actions">
              <button
                type="button"
                className="primary-action"
                disabled={!validation.valid || isExporting}
                onClick={onAddRenderJob}
              >
                <Plus size={16} />
                Add to Queue
              </button>
              <button type="button" disabled={!canRunVisualExport} onClick={onExportCurrentFrame}>
                <Image size={16} /> PNG Frame
              </button>
              <button type="button" disabled={!canRunVisualExport} onClick={onExportSequence}>
                <Archive size={16} /> PNG ZIP
              </button>
              <button
                type="button"
                disabled={!canRunVisualExport || !webmSupported}
                onClick={onExportWebM}
              >
                <Film size={16} /> WebM
              </button>
              <button type="button" disabled={isExporting || !audioSupported} onClick={onExportWav}>
                <Volume2 size={16} /> WAV
              </button>
              <button type="button" disabled={!isExporting} onClick={onCancelExport}>
                <Square size={16} /> Cancel
              </button>
            </div>
            <div className="export-actions export-package-actions">
              <button type="button" onClick={onSavePackage}>
                <Package size={16} /> Save .minemotion
              </button>
              <button type="button" onClick={onExportLegacyProject}>
                <FileJson size={16} /> Export .mmsproj
              </button>
            </div>
            <div className="export-library">
              <strong>{assetLibrary.records.length} tracked assets</strong>
              <span>{assetLibrary.records.filter((asset) => asset.missing).length} missing</span>
              <span>{assetLibrary.warnings.length} package warnings</span>
            </div>
          </section>

          <section className="export-wide-section">
            <h3>Render Queue</h3>
            <RenderQueuePanel
              queue={project.renderQueue}
              onRun={onRunRenderJob}
              onRemove={onRemoveRenderJob}
              onClearFinished={onClearFinishedRenderJobs}
            />
          </section>
        </div>
      </section>
    </div>
  );
}

function ValidationChecklist({ checklist }: { checklist?: ExportValidationChecklist }) {
  if (!checklist) return null;
  const items: Array<[keyof ExportValidationChecklist, string]> = [
    ["activeCamera", "Export camera"],
    ["frameRange", "Frame range"],
    ["outputFormat", "Format support"],
    ["missingAssets", "Asset availability"],
    ["audioSupport", "Audio compatibility"],
    ["frameCount", "Frame count"],
    ["outputSize", "Estimated size"],
    ["postProcessing", "Post-processing state"],
    ["effects", "VFX state"]
  ];
  return (
    <div className="export-checklist">
      {items.map(([key, label]) => (
        <span className={checklist[key] ? "valid" : "warning"} key={key}>
          {checklist[key] ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {label}
        </span>
      ))}
    </div>
  );
}

function EstimateBlock({ estimate }: { estimate: ExportEstimate }) {
  return (
    <div className="export-estimate">
      <span>{estimate.frameCount.toLocaleString()} frames</span>
      <span>{estimate.durationSeconds.toFixed(2)} seconds</span>
      <span>Approx. {formatBytes(estimate.estimatedSizeBytes)}</span>
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
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
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
          {validationErrors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
      {validationWarnings.length > 0 && (
        <ul className="export-warnings">
          {validationWarnings.map((warning) => <li key={warning}>{warning}</li>)}
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

function formatBytes(value: number): string {
  if (value < 1024) return `${Math.round(value)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[index]}`;
}
