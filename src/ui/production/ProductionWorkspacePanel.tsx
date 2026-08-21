import { useMemo, useRef } from "react";
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, Clapperboard, Copy, Download, Image, Play, Plus, Trash2 } from "lucide-react";
import { downloadBrowserBlob } from "../../export/BrowserDownload";
import { enqueueRenderJob } from "../../export/renderQueue/RenderQueue";
import type { MineMotionProject } from "../../project/ProjectFile";
import { createTimelineMarker, upsertMarker } from "../../animation/editor/Markers";
import {
  createProductionShot,
  createStoryboardCard,
  duplicateShotAsTake,
  removeShot,
  reorderShots,
  setActiveTake,
  updateShot
} from "../../production/ShotManager";
import { createShotHandoffManifest, createShotRenderJobs } from "../../production/ShotHandoff";
import { validateProductionShot } from "../../production/ShotValidation";
import { PRODUCTION_MARKER_TYPES, REAL_RENDER_PASSES, type ProductionMarkerType, type ProductionShot, type RenderPassId, type ShotReferenceImage } from "../../production/ShotTypes";
import { useLocalization } from "../../localization/LocalizationContext";
import { useExperimentalFeature } from "../../experimental/useExperimentalFeature";
import { CrowdPrototypePanel } from "../experimental/CrowdPrototypePanel";
import { IsometricTurntablePanel } from "../experimental/IsometricTurntablePanel";
import { SimulationWorkspaceSection } from "../simulation/SimulationWorkspaceSection";
import { UltraStudioSection } from "./UltraStudioSection";
import { DirectorAssistantSection } from "./DirectorAssistantSection";

export interface ProductionWorkspacePanelProps {
  open: boolean;
  project: MineMotionProject;
  projectSaved: boolean;
  ffmpegAvailable: boolean;
  onClose: () => void;
  onProjectChange: (project: MineMotionProject, label: string) => void;
  onSetFrame: (frame: number) => void;
  onPreviewFrames: (startFrame: number, endFrame: number) => void;
}

export function ProductionWorkspacePanel({
  open,
  project,
  projectSaved,
  ffmpegAvailable,
  onClose,
  onProjectChange,
  onSetFrame,
  onPreviewFrames
}: ProductionWorkspacePanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const crowdsEnabled = useExperimentalFeature("procedural-crowds");
  const turntableEnabled = useExperimentalFeature("isometric-turntable");
  const selected = useMemo(
    () => project.production.shots.find((shot) => shot.id === project.production.activeShotId) ?? project.production.shots[0] ?? null,
    [project.production]
  );
  if (!open) return null;

  const updateProduction = (production: MineMotionProject["production"], label: string) =>
    onProjectChange({ ...project, production }, label);

  const addShot = () => {
    const shot = createProductionShot(project);
    updateProduction({
      ...project.production,
      shots: [...project.production.shots, shot],
      activeShotId: shot.id
    }, "Create production shot");
  };

  const patchSelected = (patch: Partial<ProductionShot>, label: string) => {
    if (!selected) return;
    updateProduction(updateShot(project.production, selected.id, patch), label);
  };

  const addMarker = (type: ProductionMarkerType) => {
    const marker = createTimelineMarker(
      `${type.toUpperCase()} ${project.animation.markers.length + 1}`,
      project.animation.currentFrame,
      markerColor(type),
      type
    );
    onProjectChange({
      ...project,
      animation: {
        ...project.animation,
        markers: upsertMarker(project.animation.markers, marker)
      }
    }, "Add production marker");
  };

  const importReference = async (file: File | undefined) => {
    if (!selected || !file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) return;
    if (file.size > 1_400_000) return;
    const image: ShotReferenceImage = {
      name: file.name,
      mimeType: file.type as ShotReferenceImage["mimeType"],
      dataUrl: await readFileAsDataUrl(file)
    };
    patchSelected({ referenceImages: [...selected.referenceImages, image].slice(-12) }, "Import shot reference");
  };

  const validateSelected = () => {
    if (!selected) return;
    patchSelected({
      validation: validateProductionShot(project, selected, {
        projectSaved,
        ffmpegAvailable
      })
    }, "Validate production shot");
  };

  const queueSelected = () => {
    if (!selected) return;
    const validation = validateProductionShot(project, selected, { projectSaved, ffmpegAvailable });
    patchSelected({ validation }, "Validate and queue production shot");
    if (validation.valid) {
      const jobs = createShotRenderJobs(project, selected);
      onProjectChange({
        ...project,
        renderQueue: jobs.reduce(enqueueRenderJob, project.renderQueue)
      }, "Queue production shot");
    }
  };

  const queueAll = () => {
    const eligible = project.production.shots.filter((shot) => shot.enabled && shot.activeTake);
    const validated = eligible.map((shot) => ({ shot, validation: validateProductionShot(project, shot, { projectSaved, ffmpegAvailable }) }));
    const jobs = validated.flatMap(({ shot, validation }) => validation.valid ? createShotRenderJobs(project, { ...shot, validation }) : []);
    const production = { ...project.production, shots: project.production.shots.map((shot) => validated.find((entry) => entry.shot.id === shot.id) ? { ...shot, validation: validated.find((entry) => entry.shot.id === shot.id)!.validation } : shot) };
    onProjectChange({ ...project, production, renderQueue: jobs.reduce(enqueueRenderJob, project.renderQueue) }, "Validate and queue all active takes");
  };

  const downloadMetadata = () => {
    if (!selected) return;
    const manifest = createShotHandoffManifest(project, selected);
    downloadBrowserBlob(
      new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }),
      `${selected.outputName || selected.name}_metadata.json`
    );
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel production-modal" role="dialog" aria-modal="true" aria-label={t("production.ariaLabel")} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2><Clapperboard size={18} />{t("production.title")}</h2>
          <button type="button" onClick={onClose}>{t("common.close")}</button>
        </div>
        <div className="production-toolbar">
          <button type="button" onClick={addShot}><Plus size={14} />{t("production.addShot")}</button>
          <button type="button" disabled={!selected} onClick={() => selected && updateProduction(duplicateShotAsTake(project.production, selected.id), "Duplicate shot take")}><Copy size={14} />{t("production.newTake")}</button>
          <button type="button" disabled={!selected} onClick={() => selected && updateProduction({ ...project.production, storyboard: [...project.production.storyboard, createStoryboardCard(selected, project.animation.fps)] }, "Create storyboard card")}><Image size={14} />{t("production.storyboard")}</button>
          <button type="button" disabled={!selected} onClick={validateSelected}><CheckCircle2 size={14} />{t("production.validate")}</button>
          <button type="button" disabled={!selected} onClick={queueSelected}><Play size={14} />{t("production.queue")}</button>
          <button type="button" disabled={project.production.shots.length === 0} onClick={queueAll}><Play size={14} />{t("production.queueAll")}</button>
          <button type="button" disabled={!selected} onClick={downloadMetadata}><Download size={14} />{t("production.metadata")}</button>
        </div>
        <div className="production-layout">
          <aside className="shot-list" aria-label={t("production.shotList")}>
            {project.production.shots.length === 0 && <p className="empty-note">{t("production.empty")}</p>}
            {project.production.shots.map((shot, index) => (
              <article key={shot.id} className={`shot-card ${shot.id === selected?.id ? "selected" : ""}`}>
                <button type="button" className="shot-card-main" onClick={() => updateProduction({ ...project.production, activeShotId: shot.id }, "Select shot")}>
                  <strong>{shot.name}</strong>
                  <span>{"T"}{shot.takeNumber}{" · "}{shot.startFrame}–{shot.endFrame} · {shot.status}</span>
                  <small>{shot.validation.valid ? t("production.valid") : `${shot.validation.errors.length}E/${shot.validation.warnings.length}W`}</small>
                </button>
                <div className="shot-card-actions">
                  <button type="button" disabled={index === 0} onClick={() => updateProduction(reorderShots(project.production, shot.id, -1), "Reorder shots")}><ArrowUp size={13} /></button>
                  <button type="button" disabled={index === project.production.shots.length - 1} onClick={() => updateProduction(reorderShots(project.production, shot.id, 1), "Reorder shots")}><ArrowDown size={13} /></button>
                  <button type="button" title={t("production.jump")} onClick={() => onSetFrame(shot.startFrame)}><ArrowRight size={13} /></button>
                  <button type="button" title={t("production.preview")} onClick={() => onPreviewFrames(shot.startFrame, shot.endFrame)}><Play size={13} /></button>
                  <button type="button" onClick={() => updateProduction(removeShot(project.production, shot.id), "Delete shot")}><Trash2 size={13} /></button>
                </div>
              </article>
            ))}
          </aside>
          <div className="production-editor">
            {!selected ? <p className="empty-note">{t("production.selectShot")}</p> : <>
              <div className="form-grid two-columns">
                <label>{t("production.name")}<input value={selected.name} onChange={(event) => patchSelected({ name: event.target.value }, "Rename shot")} /></label>
                <label>{t("production.status")}<select value={selected.status} onChange={(event) => patchSelected({ status: event.target.value as ProductionShot["status"] }, "Change shot status")}>{["planned", "blocked", "ready", "rendering", "review", "approved", "final"].map((status) => <option key={status}>{status}</option>)}</select></label>
                <label>{t("production.start")}<input type="number" value={selected.startFrame} min={0} max={project.animation.durationFrames} onChange={(event) => patchSelected({ startFrame: Number(event.target.value), renderPreset: { ...selected.renderPreset, startFrame: Number(event.target.value) } }, "Change shot range")} /></label>
                <label>{t("production.end")}<input type="number" value={selected.endFrame} min={selected.startFrame} max={project.animation.durationFrames} onChange={(event) => patchSelected({ endFrame: Number(event.target.value), renderPreset: { ...selected.renderPreset, endFrame: Number(event.target.value) } }, "Change shot range")} /></label>
                <label>{t("production.camera")}<select value={selected.cameraId} onChange={(event) => patchSelected({ cameraId: event.target.value, renderPreset: { ...selected.renderPreset, cameraId: event.target.value } }, "Change shot camera")}>{project.scene.cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select></label>
                <label>{t("production.output")}<input value={selected.outputName} onChange={(event) => patchSelected({ outputName: event.target.value }, "Change shot output")} /></label>
              </div>
              <label>{t("production.notes")}<textarea value={selected.notes} onChange={(event) => patchSelected({ notes: event.target.value }, "Edit shot notes")} /></label>
              <div className="production-options">
                <label className="checkbox-label"><input type="checkbox" checked={selected.enabled} onChange={(event) => patchSelected({ enabled: event.target.checked }, "Toggle shot")} />{t("common.enabled")}</label>
                <label className="checkbox-label"><input type="checkbox" checked={selected.approved} onChange={(event) => patchSelected({ approved: event.target.checked, status: event.target.checked ? "approved" : selected.status }, "Approve shot")} />{t("production.approved")}</label>
                <label className="checkbox-label"><input type="checkbox" checked={selected.activeTake} onChange={() => updateProduction(setActiveTake(project.production, selected.id), "Set active take")} />{t("production.activeTake")}</label>
              </div>
              <fieldset><legend>{t("production.passes")}</legend><div className="production-options">{REAL_RENDER_PASSES.map((pass) => <label key={pass} className="checkbox-label"><input type="checkbox" checked={selected.renderPasses.includes(pass)} onChange={(event) => patchSelected({ renderPasses: togglePass(selected.renderPasses, pass, event.target.checked) }, "Change render passes")} />{pass}</label>)}</div></fieldset>
              <div className="production-toolbar compact"><button type="button" onClick={() => imageInputRef.current?.click()}><Image size={14} />{t("production.reference")}</button>{PRODUCTION_MARKER_TYPES.map((type) => <button type="button" key={type} onClick={() => addMarker(type)}>{type}</button>)}</div>
              <input ref={imageInputRef} className="hidden-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void importReference(event.target.files?.[0])} />
              {selected.referenceImages.length > 0 && <div className="reference-strip">{selected.referenceImages.map((image, index) => <img key={`${image.name}_${index}`} src={image.dataUrl} alt={image.name} title={image.name} />)}</div>}
              {(selected.validation.errors.length > 0 || selected.validation.warnings.length > 0) && <div className="validation-summary">{selected.validation.errors.map((message) => <p className="error-note" key={message}>{message}</p>)}{selected.validation.warnings.map((message) => <p className="warning-note" key={message}>{message}</p>)}</div>}
            </>}
            <DirectorAssistantSection project={project} onProjectChange={onProjectChange} />
            <UltraStudioSection project={project} onProjectChange={onProjectChange} />
            <SimulationWorkspaceSection project={project} onProjectChange={onProjectChange} />
            {crowdsEnabled && <CrowdPrototypePanel project={project} onProjectChange={onProjectChange} />}
            {turntableEnabled && <IsometricTurntablePanel project={project} onProjectChange={onProjectChange} />}
            <section><h3>{t("production.storyboard")}</h3><div className="storyboard-grid">{project.production.storyboard.map((card, index) => <article key={card.id}><strong>{index + 1}. {card.title}</strong><span>{card.durationFrames}{"f · "}{card.status}</span><p>{card.notes || "—"}</p></article>)}</div></section>
          </div>
        </div>
      </section>
    </div>
  );
}

function togglePass(passes: readonly RenderPassId[], pass: RenderPassId, enabled: boolean): RenderPassId[] {
  const next = enabled ? [...passes, pass] : passes.filter((candidate) => candidate !== pass);
  return [...new Set(next)].length > 0 ? [...new Set(next)] : ["beauty"];
}

function markerColor(type: ProductionMarkerType): string {
  return ({ dialogue: "#8ecae6", sfx: "#ffb703", beat: "#fb8500", action: "#ef476f", camera: "#9b5de5", vfx: "#00f5d4", note: "#f7d56b", warning: "#ff595e" } as const)[type];
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read reference image."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}
