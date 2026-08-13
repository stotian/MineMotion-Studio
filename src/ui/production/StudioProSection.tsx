import { useMemo, useState } from "react";
import { downloadBrowserBlob } from "../../export/BrowserDownload";
import type { MineMotionProject } from "../../project/ProjectFile";
import { useLocalization } from "../../localization/LocalizationContext";
import {
  CINEMA_CAMERA_PROFILES,
  PROFESSIONAL_CAMERA_MOVES,
  addProfessionalCameraMove,
  applyCinemaCameraProfile,
  autoFrameShot,
  setCameraFocusTarget,
  stabilizeCameraHorizon,
  trackSubjectDuringShot,
  type CinemaCameraProfileId,
  type ProfessionalCameraMove
} from "../../production/director/ProfessionalCamera";
import {
  addTakeReviewNote,
  addTakeReviewTag,
  approveTake,
  chooseHighestRatedTake,
  compareTakeGroup,
  createTakeRevision,
  normalizeTakeNames,
  rateTake,
  rejectTake,
  removeTakeReviewTag,
  restoreRejectedTake,
  toggleFavoriteTake
} from "../../production/director/TakeReview";
import {
  applyShotHandles,
  enableOnlyApprovedTakes,
  normalizeShotOutputs,
  renameShotsSequentially,
  setBatchRenderPasses,
  sortShotsChronologically,
  trimTimelineToActiveShots
} from "../../production/director/ShotBatchTools";
import {
  STUDIO_LIGHTING_RIGS,
  createStudioLightingRig,
  removeStudioLightingRigs,
  type StudioLightingRig
} from "../../production/director/StudioLightingRigs";
import {
  ANIMATION_POLISH_ACTIONS,
  applyAnimationPolish,
  type AnimationPolishAction
} from "../../production/director/AnimationPolish";
import {
  alignDialogueEyelines,
  analyzeShotContinuity,
  markIntentionalAxisCrossing,
  normalizeSequenceLens,
  repairAxisCrossing
} from "../../production/director/ContinuityDirector";
import {
  STUDIO_RENDER_PROFILES,
  STUDIO_RENDER_SCOPES,
  cancelQueuedProductionJobs,
  createStudioRenderQueueManifest,
  deduplicateProductionRenderQueue,
  estimateProductionRenderQueue,
  prioritizeActiveShotRenderJobs,
  queueStudioRenders,
  removeStaleProductionJobs,
  retryFailedProductionJobs,
  sortProductionRenderQueue,
  synchronizeQueuedJobsToShots,
  type StudioRenderProfile,
  type StudioRenderScope
} from "../../production/director/StudioRenderPipeline";
import {
  analyzeStudioQuality,
  autoPolishStudioProject,
  createStudioQualityReportMarkdown,
  markQualityReadyShots,
  selectLowestQualityShot
} from "../../production/director/StudioQualityControl";
import {
  annotateShotCreativeVariant,
  applyShotCreativeVariant,
  captureShotCreativeVariant,
  chooseHighestRatedShotVariant,
  compareShotCreativeVariants,
  createShotVariantManifest,
  deleteShotCreativeVariant,
  duplicateShotCreativeVariant,
  rateShotCreativeVariant,
  renameShotCreativeVariant,
  updateShotCreativeVariant
} from "../../production/director/ShotCreativeVariants";

interface StudioProSectionProps {
  project: MineMotionProject;
  primaryId: string;
  secondaryId: string;
  onProjectChange: (project: MineMotionProject, label: string) => void;
}

export function StudioProSection({ project, primaryId, secondaryId, onProjectChange }: StudioProSectionProps) {
  const { t } = useLocalization();
  const [profileId, setProfileId] = useState<CinemaCameraProfileId>("natural-35");
  const [cameraMove, setCameraMove] = useState<ProfessionalCameraMove>("dolly-in");
  const [lightingRig, setLightingRig] = useState<StudioLightingRig>("three-point");
  const [polishAction, setPolishAction] = useState<AnimationPolishAction>("breathing");
  const [rating, setRating] = useState(4);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewTag, setReviewTag] = useState("");
  const [renderProfile, setRenderProfile] = useState<StudioRenderProfile>("preview");
  const [renderScope, setRenderScope] = useState<StudioRenderScope>("approved");
  const [variantName, setVariantName] = useState("Creative variant");
  const [variantNotes, setVariantNotes] = useState("");
  const [variantRating, setVariantRating] = useState(4);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const selectedShot = project.production.shots.find((shot) => shot.id === project.production.activeShotId) ?? null;
  const takeGroup = useMemo(() => selectedShot ? compareTakeGroup(project, selectedShot.takeGroupId) : [], [project, selectedShot]);
  const variantComparison = useMemo(() => selectedShot ? compareShotCreativeVariants(project, selectedShot.id) : [], [project, selectedShot]);
  const activeVariantId = selectedVariantId && variantComparison.some((variant) => variant.id === selectedVariantId)
    ? selectedVariantId
    : selectedShot?.activeVariantId ?? variantComparison[0]?.id ?? "";
  const renderEstimate = useMemo(() => estimateProductionRenderQueue(project.renderQueue), [project.renderQueue]);
  const qualityReport = useMemo(() => analyzeStudioQuality(project), [project]);
  const continuity = useMemo(
    () => primaryId && secondaryId && primaryId !== secondaryId
      ? analyzeShotContinuity(project, primaryId, secondaryId)
      : { findings: [], axisCrossings: 0, lensJumps: 0, jumpCuts: 0 },
    [project, primaryId, secondaryId]
  );

  const apply = (result: { project: MineMotionProject; changed: boolean }, label: string) => {
    if (result.changed) onProjectChange(result.project, label);
  };

  const bestTake = () => {
    if (!selectedShot) return;
    apply(chooseHighestRatedTake(project, selectedShot.takeGroupId), "Choose best rated take");
  };

  const captureVariant = () => {
    if (!selectedShot) return;
    const result = captureShotCreativeVariant(project, selectedShot.id, variantName);
    if (result.changed) {
      setSelectedVariantId(result.variantId ?? "");
      onProjectChange(result.project, "Capture shot creative variant");
    }
  };

  return (
    <section className="director-choreography studio-pro-section">
      <div className="section-heading-row">
        <div>
          <h4>{t("studioPro.title")}</h4>
          <p>{t("studioPro.subtitle")}</p>
        </div>
        <span className="status-pill">{t("studioPro.phaseRange")}</span>
      </div>

      <div className="director-choreography">
        <h4>{t("studioPro.camera")}</h4>
        <div className="form-grid two-columns">
          <label>{t("studioPro.cameraProfile")}
            <select value={profileId} onChange={(event) => setProfileId(event.target.value as CinemaCameraProfileId)}>
              {CINEMA_CAMERA_PROFILES.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
          </label>
          <label>{t("studioPro.cameraMove")}
            <select value={cameraMove} onChange={(event) => setCameraMove(event.target.value as ProfessionalCameraMove)}>
              {PROFESSIONAL_CAMERA_MOVES.map((move) => <option key={move} value={move}>{move}</option>)}
            </select>
          </label>
        </div>
        <div className="production-toolbar compact">
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(applyCinemaCameraProfile(project, selectedShot.id, profileId), "Apply physical cinema camera")}>{t("studioPro.applyProfile")}</button>
          <button type="button" disabled={!selectedShot || !primaryId} onClick={() => selectedShot && apply(setCameraFocusTarget(project, selectedShot.id, primaryId), "Set camera focus target")}>{t("studioPro.focusActor")}</button>
          <button type="button" disabled={!selectedShot || !primaryId} onClick={() => selectedShot && apply(autoFrameShot(project, selectedShot.id, [primaryId, secondaryId].filter(Boolean), "medium"), "Auto frame shot")}>{t("studioPro.autoFrame")}</button>
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(addProfessionalCameraMove(project, selectedShot.id, cameraMove, 2.5), "Add professional camera move")}>{t("studioPro.addMove")}</button>
          <button type="button" disabled={!selectedShot || !primaryId} onClick={() => selectedShot && apply(trackSubjectDuringShot(project, selectedShot.id, primaryId), "Track subject during shot")}>{t("studioPro.trackActor")}</button>
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(stabilizeCameraHorizon(project, selectedShot.id), "Stabilize shot horizon")}>{t("studioPro.stabilize")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <h4>{t("studioPro.takeReview")}</h4>
        <div className="form-grid two-columns">
          <label>{t("studioPro.rating")}
            <input type="number" min={0} max={5} step={0.5} value={rating} onChange={(event) => setRating(Number(event.target.value) || 0)} />
          </label>
          <label>{t("studioPro.reviewNote")}
            <input value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder={t("studioPro.reviewPlaceholder")} />
          </label>
          <label>{t("studioPro.reviewTag")}
            <input value={reviewTag} onChange={(event) => setReviewTag(event.target.value)} placeholder={t("studioPro.reviewTagPlaceholder")} />
          </label>
        </div>
        <div className="production-toolbar compact">
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(rateTake(project, selectedShot.id, rating), "Rate take")}>{t("studioPro.rate")}</button>
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(toggleFavoriteTake(project, selectedShot.id), "Toggle favorite take")}>{t("studioPro.favorite")}</button>
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(rejectTake(project, selectedShot.id, reviewNote), "Reject take")}>{t("studioPro.reject")}</button>
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(restoreRejectedTake(project, selectedShot.id), "Restore take")}>{t("studioPro.restore")}</button>
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(approveTake(project, selectedShot.id), "Approve take")}>{t("studioPro.approve")}</button>
          <button type="button" disabled={!selectedShot} onClick={bestTake}>{t("studioPro.bestTake")}</button>
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(createTakeRevision(project, selectedShot.id), "Create take revision")}>{t("studioPro.newRevision")}</button>
          <button type="button" disabled={!selectedShot || !reviewNote.trim()} onClick={() => selectedShot && apply(addTakeReviewNote(project, selectedShot.id, reviewNote), "Add take review note")}>{t("studioPro.addNote")}</button>
          <button type="button" disabled={!selectedShot || !reviewTag.trim()} onClick={() => selectedShot && apply(addTakeReviewTag(project, selectedShot.id, reviewTag), "Add take review tag")}>{t("studioPro.addTag")}</button>
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(normalizeTakeNames(project, selectedShot.takeGroupId), "Normalize take names")}>{t("studioPro.normalizeTakes")}</button>
        </div>
        {selectedShot && <p className="director-event-hint">{t("studioPro.currentTake", { rating: selectedShot.rating, revision: selectedShot.revision, status: selectedShot.status })}</p>}
        {selectedShot && selectedShot.reviewTags.length > 0 && <div className="production-toolbar compact">{selectedShot.reviewTags.map((tag) => <button type="button" key={tag} title={t("studioPro.removeTag")} onClick={() => apply(removeTakeReviewTag(project, selectedShot.id, tag), "Remove take review tag")}>#{tag} ×</button>)}</div>}
        {takeGroup.length > 0 && <div className="render-job-list studio-take-list">
          <strong>{t("studioPro.takeCompare")}</strong>
          {takeGroup.map((take) => <article className={`render-job ${take.activeTake ? "render-job-running" : ""}`} key={take.shotId}>
            <div><strong>{take.name}</strong><span>{t("studioPro.takeSummary", { take: take.takeNumber, revision: take.revision, rating: take.rating, status: take.status })}</span></div>
            <div className="render-job-actions"><button type="button" onClick={() => onProjectChange({ ...project, production: { ...project.production, activeShotId: take.shotId } }, "Select reviewed take")}>{t("studioPro.selectTake")}</button></div>
          </article>)}
        </div>}
      </div>

      <div className="director-choreography">
        <h4>{t("studioPro.batch")}</h4>
        <div className="production-toolbar compact">
          <button type="button" disabled={project.production.shots.length === 0} onClick={() => apply(sortShotsChronologically(project), "Sort shots chronologically")}>{t("studioPro.sort")}</button>
          <button type="button" disabled={project.production.shots.length === 0} onClick={() => apply(renameShotsSequentially(project), "Rename shots sequentially")}>{t("studioPro.rename")}</button>
          <button type="button" disabled={project.production.shots.length === 0} onClick={() => apply(normalizeShotOutputs(project), "Normalize shot outputs")}>{t("studioPro.outputs")}</button>
          <button type="button" disabled={project.production.shots.length === 0} onClick={() => apply(applyShotHandles(project, 8), "Apply shot handles")}>{t("studioPro.handles")}</button>
          <button type="button" disabled={project.production.shots.length === 0} onClick={() => apply(setBatchRenderPasses(project, ["beauty", "characters", "vfx", "depth"]), "Set cinematic render passes")}>{t("studioPro.passes")}</button>
          <button type="button" disabled={project.production.shots.length === 0} onClick={() => apply(enableOnlyApprovedTakes(project), "Enable approved takes")}>{t("studioPro.approvedOnly")}</button>
          <button type="button" disabled={project.production.shots.length === 0} onClick={() => apply(trimTimelineToActiveShots(project), "Trim timeline to active shots")}>{t("studioPro.trim")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <h4>{t("studioPro.renderPipeline")}</h4>
        <div className="form-grid two-columns">
          <label>{t("studioPro.renderProfile")}
            <select value={renderProfile} onChange={(event) => setRenderProfile(event.target.value as StudioRenderProfile)}>
              {STUDIO_RENDER_PROFILES.map((profile) => <option key={profile} value={profile}>{t(`studioPro.renderProfile.${profile}`)}</option>)}
            </select>
          </label>
          <label>{t("studioPro.renderScope")}
            <select value={renderScope} onChange={(event) => setRenderScope(event.target.value as StudioRenderScope)}>
              {STUDIO_RENDER_SCOPES.map((scope) => <option key={scope} value={scope}>{t(`studioPro.renderScope.${scope}`)}</option>)}
            </select>
          </label>
        </div>
        <p>{t("studioPro.renderEstimate", { jobs: renderEstimate.jobs, frames: renderEstimate.frames, seconds: Math.round(renderEstimate.durationSeconds) })}</p>
        <div className="production-toolbar compact">
          <button type="button" onClick={() => apply(queueStudioRenders(project, renderProfile, renderScope), "Queue studio renders")}>{t("studioPro.queueRenders")}</button>
          <button type="button" disabled={project.renderQueue.jobs.length === 0} onClick={() => apply(deduplicateProductionRenderQueue(project), "Deduplicate render queue")}>{t("studioPro.deduplicateQueue")}</button>
          <button type="button" disabled={project.renderQueue.jobs.length === 0} onClick={() => apply(sortProductionRenderQueue(project), "Sort production render queue")}>{t("studioPro.sortQueue")}</button>
          <button type="button" disabled={!project.production.activeShotId || project.renderQueue.jobs.length === 0} onClick={() => apply(prioritizeActiveShotRenderJobs(project), "Prioritize active shot renders")}>{t("studioPro.prioritizeActive")}</button>
          <button type="button" disabled={!project.renderQueue.jobs.some((job) => job.status === "error" || job.status === "cancelled")} onClick={() => apply(retryFailedProductionJobs(project), "Retry failed production renders")}>{t("studioPro.retryFailed")}</button>
          <button type="button" disabled={!project.renderQueue.jobs.some((job) => job.status === "queued" && job.production)} onClick={() => apply(cancelQueuedProductionJobs(project), "Cancel queued production renders")}>{t("studioPro.cancelQueued")}</button>
          <button type="button" disabled={project.renderQueue.jobs.length === 0} onClick={() => apply(removeStaleProductionJobs(project), "Remove stale production renders")}>{t("studioPro.removeStale")}</button>
          <button type="button" disabled={project.renderQueue.jobs.length === 0} onClick={() => apply(synchronizeQueuedJobsToShots(project), "Synchronize renders to shots")}>{t("studioPro.syncQueue")}</button>
          <button type="button" disabled={project.renderQueue.jobs.length === 0} onClick={() => downloadBrowserBlob(new Blob([createStudioRenderQueueManifest(project)], { type: "application/json" }), "minemotion-render-queue.json")}>{t("studioPro.exportQueueManifest")}</button>
        </div>
      </div>

      <div className="director-choreography studio-variants-section">
        <div className="section-heading-row">
          <div>
            <h4>{t("studioPro.variants.title")}</h4>
            <p>{t("studioPro.variants.subtitle")}</p>
          </div>
          <span className="status-pill">{variantComparison.length}/32</span>
        </div>
        <div className="form-grid two-columns">
          <label>{t("studioPro.variants.variant")}
            <select value={activeVariantId} onChange={(event) => setSelectedVariantId(event.target.value)} disabled={variantComparison.length === 0}>
              {variantComparison.length === 0 && <option value="">{t("studioPro.variants.none")}</option>}
              {variantComparison.map((variant) => <option value={variant.id} key={variant.id}>{t("studioPro.variants.option", { name: variant.name, rating: variant.rating, focalLength: variant.focalLength })}</option>)}
            </select>
          </label>
          <label>{t("studioPro.variants.name")}
            <input value={variantName} onChange={(event) => setVariantName(event.target.value)} />
          </label>
          <label>{t("studioPro.variants.notes")}
            <input value={variantNotes} onChange={(event) => setVariantNotes(event.target.value)} placeholder={t("studioPro.variants.notesPlaceholder")} />
          </label>
          <label>{t("studioPro.variants.rating")}
            <input type="number" min={0} max={5} step={0.5} value={variantRating} onChange={(event) => setVariantRating(Number(event.target.value) || 0)} />
          </label>
        </div>
        <div className="production-toolbar compact">
          <button type="button" disabled={!selectedShot} onClick={captureVariant}>{t("studioPro.variants.capture")}</button>
          <button type="button" disabled={!selectedShot || !activeVariantId} onClick={() => selectedShot && apply(updateShotCreativeVariant(project, selectedShot.id, activeVariantId), "Update shot creative variant")}>{t("studioPro.variants.update")}</button>
          <button type="button" disabled={!selectedShot || !activeVariantId} onClick={() => selectedShot && apply(applyShotCreativeVariant(project, selectedShot.id, activeVariantId), "Apply shot creative variant")}>{t("studioPro.variants.apply")}</button>
          <button type="button" disabled={!selectedShot || !activeVariantId} onClick={() => selectedShot && apply(duplicateShotCreativeVariant(project, selectedShot.id, activeVariantId), "Duplicate shot creative variant")}>{t("studioPro.variants.duplicate")}</button>
          <button type="button" disabled={!selectedShot || !activeVariantId || !variantName.trim()} onClick={() => selectedShot && apply(renameShotCreativeVariant(project, selectedShot.id, activeVariantId, variantName), "Rename shot creative variant")}>{t("studioPro.variants.rename")}</button>
          <button type="button" disabled={!selectedShot || !activeVariantId} onClick={() => selectedShot && apply(annotateShotCreativeVariant(project, selectedShot.id, activeVariantId, variantNotes), "Annotate shot creative variant")}>{t("studioPro.variants.annotate")}</button>
          <button type="button" disabled={!selectedShot || !activeVariantId} onClick={() => selectedShot && apply(rateShotCreativeVariant(project, selectedShot.id, activeVariantId, variantRating), "Rate shot creative variant")}>{t("studioPro.variants.rate")}</button>
          <button type="button" disabled={!selectedShot || variantComparison.length === 0} onClick={() => selectedShot && apply(chooseHighestRatedShotVariant(project, selectedShot.id), "Apply best shot creative variant")}>{t("studioPro.variants.best")}</button>
          <button type="button" disabled={!selectedShot || !activeVariantId} onClick={() => selectedShot && apply(deleteShotCreativeVariant(project, selectedShot.id, activeVariantId), "Delete shot creative variant")}>{t("studioPro.variants.delete")}</button>
          <button type="button" disabled={!selectedShot || variantComparison.length === 0} onClick={() => selectedShot && downloadBrowserBlob(new Blob([createShotVariantManifest(project, selectedShot.id)], { type: "application/json" }), `${selectedShot.outputName || selectedShot.name}-variants.json`)}>{t("studioPro.variants.export")}</button>
        </div>
        {variantComparison.length > 0 && <div className="studio-quality-grid">
          {variantComparison.map((variant) => <article className={`render-job ${variant.active ? "render-job-running" : ""}`} key={variant.id}>
            <div><strong>{variant.name}</strong><span>{t("studioPro.variants.summary", { rating: variant.rating, lens: variant.focalLength, lights: variant.lightCount, passes: variant.renderPassCount })}</span></div>
          </article>)}
        </div>}
      </div>

      <div className="director-choreography studio-quality-section">
        <div className="section-heading-row">
          <div>
            <h4>{t("studioPro.quality.title")}</h4>
            <p>{t("studioPro.quality.subtitle")}</p>
          </div>
          <span className={`status-pill ${qualityReport.ready ? "status-pill-success" : ""}`}>{qualityReport.overallScore}/100</span>
        </div>
        <div className="studio-quality-grid">
          {qualityReport.categories.map((category) => <article className="render-job" key={category.id}>
            <div>
              <strong>{t(`studioPro.quality.category.${category.id}`)}</strong>
              <span>{t("studioPro.quality.categorySummary", { score: category.score, passed: category.passed, total: category.total, issues: category.issues.length })}</span>
            </div>
          </article>)}
        </div>
        <div className="production-toolbar compact">
          <button type="button" disabled={!qualityReport.worstShotId} onClick={() => apply(selectLowestQualityShot(project), "Focus lowest-quality shot")}>{t("studioPro.quality.focusWorst")}</button>
          <button type="button" onClick={() => apply(autoPolishStudioProject(project), "Auto-polish studio project")}>{t("studioPro.quality.autoPolish")}</button>
          <button type="button" disabled={qualityReport.shots.length === 0} onClick={() => apply(markQualityReadyShots(project), "Mark quality-ready shots")}>{t("studioPro.quality.markReady")}</button>
          <button type="button" onClick={() => downloadBrowserBlob(new Blob([createStudioQualityReportMarkdown(project)], { type: "text/markdown" }), "minemotion-studio-quality.md")}>{t("studioPro.quality.export")}</button>
        </div>
        {qualityReport.issues.length > 0 ? <div className="render-job-list">
          {qualityReport.issues.slice(0, 8).map((entry) => <article className={`render-job ${entry.severity === "error" ? "render-job-error" : ""}`} key={entry.id}>
            <div>
              <strong>{t(`studioPro.quality.category.${entry.category}`)} · {entry.severity}</strong>
              <span>{entry.message}</span>
            </div>
          </article>)}
        </div> : <p>{t("studioPro.quality.clean")}</p>}
      </div>

      <div className="director-choreography">
        <h4>{t("studioPro.lighting")}</h4>
        <div className="form-grid two-columns">
          <label>{t("studioPro.lightingRig")}
            <select value={lightingRig} onChange={(event) => setLightingRig(event.target.value as StudioLightingRig)}>
              {STUDIO_LIGHTING_RIGS.map((rig) => <option key={rig} value={rig}>{rig}</option>)}
            </select>
          </label>
          <label>{t("studioPro.polish")}
            <select value={polishAction} onChange={(event) => setPolishAction(event.target.value as AnimationPolishAction)}>
              {ANIMATION_POLISH_ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}
            </select>
          </label>
        </div>
        <div className="production-toolbar compact">
          <button type="button" onClick={() => apply(createStudioLightingRig(project, lightingRig, primaryId), "Create rendered studio lighting rig")}>{t("studioPro.createLighting")}</button>
          <button type="button" onClick={() => apply(removeStudioLightingRigs(project), "Remove studio lighting rigs")}>{t("studioPro.removeLighting")}</button>
          <button type="button" disabled={!primaryId} onClick={() => apply(applyAnimationPolish(project, primaryId, polishAction), "Apply animation polish")}>{t("studioPro.applyPolish")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <h4>{t("studioPro.continuity")}</h4>
        <p>{t("studioPro.continuityReport", { crossings: continuity.axisCrossings, lenses: continuity.lensJumps, jumps: continuity.jumpCuts })}</p>
        <div className="production-toolbar compact">
          <button type="button" disabled={!selectedShot || !primaryId || !secondaryId || primaryId === secondaryId} onClick={() => selectedShot && apply(repairAxisCrossing(project, selectedShot.id, primaryId, secondaryId), "Repair 180-degree axis")}>{t("studioPro.repairAxis")}</button>
          <button type="button" disabled={project.production.shots.length === 0} onClick={() => apply(normalizeSequenceLens(project, 50), "Normalize sequence lens")}>{t("studioPro.normalizeLens")}</button>
          <button type="button" disabled={!primaryId || !secondaryId || primaryId === secondaryId} onClick={() => apply(alignDialogueEyelines(project, primaryId, secondaryId), "Align dialogue eyelines")}>{t("studioPro.eyelines")}</button>
          <button type="button" disabled={!selectedShot} onClick={() => selectedShot && apply(markIntentionalAxisCrossing(project, selectedShot.id), "Mark intentional axis crossing")}>{t("studioPro.intentional")}</button>
        </div>
      </div>
    </section>
  );
}
