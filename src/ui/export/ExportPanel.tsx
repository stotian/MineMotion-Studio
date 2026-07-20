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
import { isAudioMixdownSupported } from "../../audio/export/AudioExportSupport";
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
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";
import { localizeExportValidationMessage } from "../../localization/LocalizationDomainMessages";
import { formatLocalizedDiagnostic } from "../../localization/LocalizationDiagnostics";

const EXPORT_PRESET_KEYS: Readonly<Record<string, TranslationKey>> = {
  "draft-720p": "export.preset.draft720",
  "youtube-1080p": "export.preset.youtube1080",
  "youtube-1440p": "export.preset.youtube1440",
  "vertical-1080x1920": "export.preset.vertical",
  "cinematic-235": "export.preset.cinematic",
  "square-1080": "export.preset.square",
  "png-sequence-hq": "export.preset.pngHigh",
  "transparent-png-sequence": "export.preset.pngTransparent",
  "low-file-size-webm": "export.preset.webmSmall"
};

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
  const localization = useLocalization();
  const t = localization.t.bind(localization);
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
        aria-label={t("export.ariaLabel")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Download size={18} />
            {t("export.title")}
          </h2>
          <button type="button" onClick={onClose}>{t("common.close")}</button>
        </div>

        <div className="export-layout">
          <section>
            <h3>{t("export.output")}</h3>
            <label>
              {t("export.outputName")}
              <input
                value={settings.outputName}
                onChange={(event) => updateSettings({ outputName: event.target.value })}
              />
            </label>
            <label>
              {t("export.format")}
              <select
                value={settings.format}
                onChange={(event) => updateSettings({ format: event.target.value as ExportFormat })}
              >
                <optgroup label={t("export.group.browserDesktop")}>
                  <option value="png_frame">{t("export.format.pngFrame")}</option>
                  <option value="png_sequence">{t("export.format.pngSequence")}</option>
                  <option value="webm_video">{t("export.format.webm")}</option>
                  <option value="wav_audio">{t("export.format.wav")}</option>
                  <option value="minemotion_package">{t("export.format.package")}</option>
                  <option value="audio_metadata">{t("export.format.audioMetadata")}</option>
                </optgroup>
                <optgroup label={t("export.group.ffmpeg")}>
                  <option value="mp4_h264">{t("export.format.mp4H264")}</option>
                  <option value="mp4_h265">{t("export.format.mp4H265")}</option>
                  <option value="prores_video">{t("export.format.prores")}</option>
                  <option value="mp3_audio">{t("export.format.mp3")}</option>
                </optgroup>
              </select>
            </label>
            <div className="export-grid-2">
              <NumberField
                label={t("export.startFrame")}
                value={settings.startFrame}
                min={0}
                max={project.animation.durationFrames}
                onChange={(value) => updateSettings({ startFrame: value })}
              />
              <NumberField
                label={t("export.endFrame")}
                value={settings.endFrame}
                min={0}
                onChange={(value) => updateSettings({ endFrame: value })}
              />
              <NumberField
                label={t("export.fps")}
                value={settings.fps}
                min={1}
                max={120}
                onChange={(value) => updateSettings({ fps: value })}
              />
              <label>
                {t("export.quality")}
                <select
                  value={settings.quality}
                  onChange={(event) => updateSettings({ quality: event.target.value as ExportSettings["quality"] })}
                >
                  <option value="draft">{t("export.quality.draft")}</option>
                  <option value="medium">{t("common.medium")}</option>
                  <option value="high">{t("common.high")}</option>
                </select>
              </label>
              <NumberField
                label={t("export.width")}
                value={settings.width}
                min={1}
                onChange={(value) => updateSettings({ width: value })}
              />
              <NumberField
                label={t("export.height")}
                value={settings.height}
                min={1}
                onChange={(value) => updateSettings({ height: value })}
              />
            </div>
            <label>
              {t("export.camera")}
              <select
                value={settings.cameraId}
                onChange={(event) => updateSettings({ cameraId: event.target.value })}
              >
                <option value="active">{t("export.activeCamera")}</option>
                <option value="viewport">{t("export.viewportCamera")}</option>
                {project.scene.cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>{camera.name}</option>
                ))}
              </select>
            </label>
          </section>

          <section>
            <h3>{t("export.options")}</h3>
            <CheckboxField
              label={t("export.includePost")}
              checked={settings.includePostProcessing}
              onChange={(value) => updateSettings({ includePostProcessing: value })}
            />
            <CheckboxField
              label={t("export.includeVfx")}
              checked={settings.includeVfx}
              onChange={(value) => updateSettings({ includeVfx: value })}
            />
            <CheckboxField
              label={t("export.includeBars")}
              checked={settings.includeCinematicBars}
              onChange={(value) => updateSettings({ includeCinematicBars: value })}
            />
            <CheckboxField
              label={t("export.transparent")}
              checked={settings.transparentBackground}
              onChange={(value) => updateSettings({ transparentBackground: value })}
            />
            <CheckboxField
              label={t("export.includeAudio")}
              checked={settings.includeAudio}
              onChange={(value) => updateSettings({ includeAudio: value })}
            />
            <div className="export-presets">
              {EXPORT_PRESETS.map((preset) => (
                <button key={preset.id} type="button" onClick={() => updateSettings(preset.settings)}>
                  {t(EXPORT_PRESET_KEYS[preset.id] ?? "export.preset.draft720")}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3><HardDrive size={16} /> {t("export.ffmpeg")}</h3>
            <label>
              {t("export.ffmpegPath")}
              <input
                value={project.ffmpegSettings.executablePath}
                onChange={(event) => updateFfmpegSettings({ executablePath: event.target.value })}
                placeholder="ffmpeg or C:\\ffmpeg\\bin\\ffmpeg.exe"
              />
            </label>
            <label>
              {t("export.outputDirectory")}
              <input
                value={project.ffmpegSettings.outputDirectory}
                onChange={(event) => updateFfmpegSettings({ outputDirectory: event.target.value })}
                placeholder="C:\\Users\\you\\Videos"
              />
            </label>
            <label>
              {t("export.encodingTarget")}
              <select
                value={project.ffmpegSettings.videoQuality}
                onChange={(event) => updateFfmpegSettings({
                  videoQuality: event.target.value as FfmpegSettings["videoQuality"]
                })}
              >
                <option value="small">{t("export.encoding.small")}</option>
                <option value="balanced">{t("export.encoding.balanced")}</option>
                <option value="high">{t("export.encoding.high")}</option>
              </select>
            </label>
            <CheckboxField
              label={t("export.overwrite")}
              checked={project.ffmpegSettings.overwriteExisting}
              onChange={(value) => updateFfmpegSettings({ overwriteExisting: value })}
            />
            <div className="ffmpeg-status">
              {ffmpegDetection.available ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{t(ffmpegDetection.available ? "export.ffmpegAvailable" : "export.ffmpegUnavailable")}</span>
            </div>
            <button type="button" onClick={onDetectFfmpeg} disabled={isExporting}>
              <RefreshCw size={15} />
              {t("export.detectFfmpeg")}
            </button>
          </section>

          <section>
            <h3>{t("export.validation")}</h3>
            <ValidationChecklist checklist={validation.checklist} />
            {validation.estimates && <EstimateBlock estimate={validation.estimates} />}
            <StatusBlock
              validationErrors={validation.errors.map((message) => localizeExportValidationMessage(localization, message))}
              validationWarnings={[
                ...validation.warnings.map((message) => localizeExportValidationMessage(localization, message)),
                ...(webmSupported ? [] : [t("export.webmUnavailable")]),
                ...(audioSupported ? [] : [t("export.audioUnavailable")])
              ]}
              progress={progress}
            />
          </section>

          <section>
            <h3>{t("export.runPackage")}</h3>
            <div className="export-actions">
              <button
                type="button"
                className="primary-action"
                disabled={!validation.valid || isExporting}
                onClick={onAddRenderJob}
              >
                <Plus size={16} />
                {t("export.addQueue")}
              </button>
              <button type="button" disabled={!canRunVisualExport} onClick={onExportCurrentFrame}>
                <Image size={16} /> {t("export.pngFrame")}
              </button>
              <button type="button" disabled={!canRunVisualExport} onClick={onExportSequence}>
                <Archive size={16} /> {t("export.pngZip")}
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
                <Square size={16} /> {t("export.cancel")}
              </button>
            </div>
            <div className="export-actions export-package-actions">
              <button type="button" onClick={onSavePackage}>
                <Package size={16} /> {t("export.savePackage")}
              </button>
              <button type="button" onClick={onExportLegacyProject}>
                <FileJson size={16} /> {t("export.exportLegacy")}
              </button>
            </div>
            <div className="export-library">
              <strong>{localization.plural({ one: "export.trackedAssets.one", other: "export.trackedAssets.other" }, assetLibrary.records.length)}</strong>
              <span>{localization.plural({ one: "export.missingAssets.one", other: "export.missingAssets.other" }, assetLibrary.records.filter((asset) => asset.missing).length)}</span>
              <span>{localization.plural({ one: "export.packageWarnings.one", other: "export.packageWarnings.other" }, assetLibrary.warnings.length)}</span>
            </div>
          </section>

          <section className="export-wide-section">
            <h3>{t("export.renderQueue")}</h3>
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
  const localization = useLocalization();
  if (!checklist) return null;
  const items: Array<[keyof ExportValidationChecklist, TranslationKey]> = [
    ["activeCamera", "export.check.camera"],
    ["frameRange", "export.check.frameRange"],
    ["outputFormat", "export.check.format"],
    ["missingAssets", "export.check.assets"],
    ["audioSupport", "export.check.audio"],
    ["frameCount", "export.check.frameCount"],
    ["outputSize", "export.check.size"],
    ["postProcessing", "export.check.post"],
    ["effects", "export.check.effects"]
  ];
  return (
    <div className="export-checklist">
      {items.map(([key, labelKey]) => (
        <span className={checklist[key] ? "valid" : "warning"} key={key}>
          {checklist[key] ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {localization.t(labelKey)}
        </span>
      ))}
    </div>
  );
}

function EstimateBlock({ estimate }: { estimate: ExportEstimate }) {
  const localization = useLocalization();
  return (
    <div className="export-estimate">
      <span>{localization.plural({ one: "export.frames.one", other: "export.frames.other" }, estimate.frameCount)}</span>
      <span>{localization.t("export.seconds", { count: localization.formatNumber(estimate.durationSeconds, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) })}</span>
      <span>{localization.t("export.approx", { size: formatBytes(estimate.estimatedSizeBytes, localization) })}</span>
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
  const localization = useLocalization();
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
        <strong>{localization.t(`export.status.${progress.status}` as TranslationKey)}</strong>
        <span>{localization.t(`export.progress.${progress.status}` as TranslationKey)}</span>
        {progress.totalFrames > 0 && (
          <progress value={progress.currentFrame} max={progress.totalFrames} />
        )}
        {progress.error && <small>{formatLocalizedDiagnostic(localization, "EXPORT_RUNTIME_FAILED", "export.runtimeFailed")}</small>}
      </div>
    </div>
  );
}

function formatBytes(value: number, localization: ReturnType<typeof useLocalization>): string {
  if (value < 1024) return `${localization.formatNumber(Math.round(value))} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${localization.formatNumber(size, { maximumFractionDigits: size >= 100 ? 0 : 1 })} ${units[index]}`;
}
