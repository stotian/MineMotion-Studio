import type { MineMotionProject } from "../../project/ProjectFile";
import { createCharacter, createInitialProject } from "../../project/ProjectStore";
import { sanitizeProductionData } from "../ShotManager";
import { buildDirectorSequence } from "./DirectorSequenceBuilder";
import { prepareDialogueSequence } from "./DialogueDirector";
import { duplicateDirectedShotAsTake } from "./ShotEditing";
import {
  CINEMA_CAMERA_PROFILES,
  PROFESSIONAL_CAMERA_MOVES,
  addProfessionalCameraMove,
  applyCinemaCameraProfile,
  autoFrameShot,
  setCameraFocusTarget,
  stabilizeCameraHorizon,
  trackSubjectDuringShot
} from "./ProfessionalCamera";
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
} from "./TakeReview";
import {
  applyShotHandles,
  enableOnlyApprovedTakes,
  normalizeShotOutputs,
  renameShotsSequentially,
  setBatchRenderPasses,
  setBatchShotStatus,
  sortShotsChronologically,
  trimTimelineToActiveShots
} from "./ShotBatchTools";
import { STUDIO_LIGHTING_RIGS, createStudioLightingRig, removeStudioLightingRigs } from "./StudioLightingRigs";
import { ANIMATION_POLISH_ACTIONS, applyAnimationPolish } from "./AnimationPolish";
import {
  alignDialogueEyelines,
  analyzeShotContinuity,
  markIntentionalAxisCrossing,
  normalizeSequenceLens,
  repairAxisCrossing
} from "./ContinuityDirector";
import {
  buildStudioRenderPlan,
  cancelQueuedProductionJobs,
  createStudioRenderQueueManifest,
  deduplicateProductionRenderQueue,
  enqueueStudioRenderPlan,
  estimateProductionRenderQueue,
  prioritizeActiveShotRenderJobs,
  queueStudioRenders,
  removeStaleProductionJobs,
  retryFailedProductionJobs,
  sortProductionRenderQueue,
  synchronizeQueuedJobsToShots
} from "./StudioRenderPipeline";
import {
  analyzeStudioQuality,
  autoPolishStudioProject,
  buildShotQualitySnapshots,
  createStudioQualityReportMarkdown,
  evaluateAudioQuality,
  evaluateCameraQuality,
  evaluateContinuityQuality,
  evaluateLightingQuality,
  evaluateRenderQuality,
  evaluateTakeQuality,
  markQualityReadyShots,
  selectLowestQualityShot
} from "./StudioQualityControl";
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
} from "./ShotCreativeVariants";

export interface StudioProAcceptanceContext {
  assert: (condition: unknown, message: string) => void;
  cover: (acceptanceId: string) => void;
}

export interface StudioProAcceptanceResult {
  project: MineMotionProject;
  studioFeatures: number;
}

export function runStudioProAcceptance(context: StudioProAcceptanceContext): StudioProAcceptanceResult {
  const { assert, cover } = context;
  let project = createInitialProject();
  const first = project.scene.characters[0];
  const second = createCharacter("Studio Alex", [3, 1.05, -1]);
  project = { ...project, scene: { ...project.scene, characters: [first, second] } };
  const prepared = prepareDialogueSequence(project, {
    firstCharacterId: first.id,
    secondCharacterId: second.id,
    startFrame: 0,
    secondsPerShot: 1.5,
    stageActors: true
  });
  project = buildDirectorSequence(prepared.project, prepared.blueprint).project;
  const shot = project.production.shots[0];
  assert(Boolean(shot), "Studio Pro acceptance could not create a base shot.");

  for (const profile of CINEMA_CAMERA_PROFILES) {
    const applied = applyCinemaCameraProfile(project, shot.id, profile.id);
    assert(applied.changed && applied.error === null, `${profile.id} camera profile did not apply.`);
    const camera = applied.project.scene.cameras.find((candidate) => candidate.id === shot.cameraId);
    assert(camera?.focalLength === profile.focalLengthMm, `${profile.id} camera profile lost focal length.`);
    assert(camera?.metadata.cinemaProfileId === profile.id, `${profile.id} camera profile metadata is missing.`);
    cover(`director-camera-profile-${profile.id}`);
  }

  const focus = setCameraFocusTarget(project, shot.id, first.id);
  assert(focus.changed && Number(focus.project.scene.cameras.find((camera) => camera.id === shot.cameraId)?.metadata.focusDistance) > 0, "Camera focus target did not persist a valid distance.");
  cover("director-camera-focus-target");
  project = focus.project;

  const framed = autoFrameShot(project, shot.id, [first.id, second.id], "medium");
  assert(framed.changed && framed.project.scene.cameras.find((camera) => camera.id === shot.cameraId)?.metadata.autoFraming === "medium", "Automatic shot framing did not update the camera.");
  cover("director-camera-auto-frame");
  project = framed.project;

  for (const move of PROFESSIONAL_CAMERA_MOVES) {
    const moved = addProfessionalCameraMove(project, shot.id, move, 2);
    assert(moved.changed && moved.affectedTrackIds.length === 2, `${move} did not create position and rotation tracks.`);
    assert(moved.affectedTrackIds.every((id) => moved.project.animation.tracks.some((track) => track.id === id)), `${move} returned missing tracks.`);
    cover(`director-camera-move-${move}`);
  }

  const tracked = trackSubjectDuringShot(project, shot.id, first.id, 6);
  assert(tracked.changed && tracked.project.animation.tracks.some((track) => track.id === `${shot.cameraId}:transform.rotation` && track.keyframes.length >= 7), "Subject tracking did not create sampled camera rotations.");
  cover("director-camera-subject-tracking");
  const stabilized = stabilizeCameraHorizon(tracked.project, shot.id);
  assert(stabilized.changed && stabilized.project.scene.cameras.find((camera) => camera.id === shot.cameraId)?.transform.rotation[2] === 0, "Horizon stabilization did not clear camera roll.");
  cover("director-camera-horizon-stabilize");
  project = stabilized.project;

  const duplicate = duplicateDirectedShotAsTake(project, shot.id);
  assert(duplicate.changed && duplicate.affectedShotIds.length === 2, "Take review acceptance could not create a second take.");
  project = duplicate.project;
  const secondTakeId = duplicate.affectedShotIds.find((id) => id !== shot.id)!;
  const groupId = project.production.shots.find((candidate) => candidate.id === shot.id)!.takeGroupId;

  project = rateTake(project, shot.id, 3.5).project;
  assert(project.production.shots.find((candidate) => candidate.id === shot.id)?.rating === 3.5, "Take rating was not persisted.");
  cover("director-take-rate");
  project = rateTake(project, secondTakeId, 5).project;
  project = toggleFavoriteTake(project, secondTakeId).project;
  assert(project.production.shots.find((candidate) => candidate.id === secondTakeId)?.favorite, "Favorite take flag was not persisted.");
  cover("director-take-favorite");
  project = rejectTake(project, shot.id, "Camera shake too strong").project;
  assert(project.production.shots.find((candidate) => candidate.id === shot.id)?.rejected, "Take rejection was not persisted.");
  cover("director-take-reject");
  project = restoreRejectedTake(project, shot.id).project;
  assert(!project.production.shots.find((candidate) => candidate.id === shot.id)?.rejected, "Rejected take could not be restored.");
  cover("director-take-restore");
  project = approveTake(project, secondTakeId).project;
  assert(project.production.shots.find((candidate) => candidate.id === secondTakeId)?.approved, "Take approval was not persisted.");
  cover("director-take-approve");
  const best = chooseHighestRatedTake(project, groupId);
  assert(best.changed && best.shotId === secondTakeId && best.project.production.activeShotId === secondTakeId, "Best-take selection did not choose the highest-rated favorite take.");
  cover("director-take-choose-best");
  project = best.project;
  project = addTakeReviewNote(project, secondTakeId, "Strong performance").project;
  assert(project.production.shots.find((candidate) => candidate.id === secondTakeId)?.reviewNotes.includes("Strong performance"), "Take review note was not persisted.");
  cover("director-take-note");
  project = addTakeReviewTag(project, secondTakeId, "Best Performance").project;
  assert(project.production.shots.find((candidate) => candidate.id === secondTakeId)?.reviewTags.includes("best-performance"), "Take review tag was not normalized and persisted.");
  cover("director-take-tag-add");
  project = removeTakeReviewTag(project, secondTakeId, "Best Performance").project;
  assert(!project.production.shots.find((candidate) => candidate.id === secondTakeId)?.reviewTags.includes("best-performance"), "Take review tag was not removed.");
  cover("director-take-tag-remove");
  const revisionBefore = project.production.shots.find((candidate) => candidate.id === secondTakeId)!.revision;
  project = createTakeRevision(project, secondTakeId).project;
  assert(project.production.shots.find((candidate) => candidate.id === secondTakeId)?.revision === revisionBefore + 1, "Take revision did not increment.");
  cover("director-take-revision");
  project = normalizeTakeNames(project, groupId).project;
  assert(project.production.shots.filter((candidate) => candidate.takeGroupId === groupId).every((candidate) => /T\d{2}$/.test(candidate.name)), "Take names were not normalized.");
  cover("director-take-normalize-names");
  const comparison = compareTakeGroup(project, groupId);
  assert(comparison.length === 2 && comparison[0].takeNumber < comparison[1].takeNumber, "Take comparison did not return an ordered group.");
  cover("director-take-compare");
  const serializedProduction = JSON.parse(JSON.stringify(project.production)) as unknown;
  const restoredProduction = sanitizeProductionData(serializedProduction, project);
  const reloadedTake = restoredProduction.shots.find((candidate) => candidate.id === secondTakeId);
  assert(reloadedTake?.rating === 5 && reloadedTake.revision >= 2, "Take review data did not survive project serialization.");
  assert(Array.isArray(reloadedTake?.reviewTags) && typeof reloadedTake?.reviewNotes === "string", "Take review collections did not survive project serialization.");
  project = { ...project, production: restoredProduction };

  project = sortShotsChronologically(project).project;
  assert(project.production.shots.every((candidate, index, shots) => index === 0 || shots[index - 1].startFrame <= candidate.startFrame), "Batch chronological sort failed.");
  cover("director-batch-sort");
  project = renameShotsSequentially(project, "SQ", 10).project;
  assert(project.production.shots.every((candidate) => /^SQ\d{3}$/.test(candidate.name)), "Batch sequential rename failed.");
  cover("director-batch-rename");
  project = normalizeShotOutputs(project).project;
  assert(project.production.shots.every((candidate) => candidate.outputName.includes("_T") && candidate.outputName.includes("_R")), "Batch output normalization failed.");
  cover("director-batch-output");
  project = applyShotHandles(project, 8).project;
  assert(project.production.shots.every((candidate) => candidate.renderPreset.startFrame <= candidate.startFrame && candidate.renderPreset.endFrame >= candidate.endFrame), "Batch handles did not expand render ranges.");
  cover("director-batch-handles");
  project = setBatchShotStatus(project, "review").project;
  assert(project.production.shots.every((candidate) => candidate.status === "review"), "Batch status update failed.");
  cover("director-batch-status");
  project = setBatchRenderPasses(project, ["beauty", "characters", "depth"]).project;
  assert(project.production.shots.every((candidate) => candidate.renderPasses.length === 3), "Batch render-pass update failed.");
  cover("director-batch-passes");
  project = approveTake(project, secondTakeId).project;
  project = enableOnlyApprovedTakes(project).project;
  assert(project.production.shots.filter((candidate) => candidate.takeGroupId === groupId).filter((candidate) => candidate.enabled).length === 1, "Approved-take isolation did not enable exactly one take.");
  cover("director-batch-approved-only");
  const trimmed = trimTimelineToActiveShots(project, 6);
  assert(trimmed.changed && trimmed.project.animation.durationFrames === Math.max(...trimmed.project.production.shots.filter((candidate) => candidate.enabled && !candidate.rejected).map((candidate) => candidate.endFrame + 6)), "Timeline trim did not match active shots.");
  cover("director-batch-trim-timeline");
  project = trimmed.project;

  for (const rig of STUDIO_LIGHTING_RIGS) {
    const lit = createStudioLightingRig(project, rig, first.id);
    assert(lit.changed && lit.lightIds.length >= 2, `${rig} lighting rig did not create useful scene lights.`);
    assert(lit.lightIds.every((id) => lit.project.scene.lights.some((light) => light.id === id && light.metadata.studioRig === rig)), `${rig} lighting rig returned invalid lights.`);
    cover(`director-lighting-${rig}`);
    project = lit.project;
  }
  const removedLights = removeStudioLightingRigs(project);
  assert(removedLights.changed && removedLights.project.scene.lights.every((light) => typeof light.metadata.studioRig !== "string"), "Studio lighting cleanup left generated lights behind.");
  cover("director-lighting-remove");
  project = removedLights.project;

  for (const action of ANIMATION_POLISH_ACTIONS) {
    const polished = applyAnimationPolish(project, first.id, action, 24, 36, 1);
    assert(polished.changed && polished.trackIds.length >= 1, `${action} animation polish did not create tracks.`);
    assert(polished.trackIds.every((id) => polished.project.animation.tracks.some((track) => track.id === id)), `${action} animation polish returned missing track ids.`);
    cover(`director-polish-${action}`);
  }

  const continuity = analyzeShotContinuity(project, first.id, second.id);
  assert(continuity.findings.length >= 5, "Continuity analysis did not inspect the active sequence.");
  cover("director-continuity-analyze");
  const crossingTarget = project.production.shots[1];
  const repairedAxis = repairAxisCrossing(project, crossingTarget.id, first.id, second.id);
  assert(repairedAxis.changed && repairedAxis.project.scene.cameras.find((camera) => camera.id === crossingTarget.cameraId)?.metadata.continuityAxisRepaired === true, "Axis repair did not update the shot camera.");
  cover("director-continuity-repair-axis");
  project = repairedAxis.project;
  const normalizedLens = normalizeSequenceLens(project, 50);
  assert(normalizedLens.changed && normalizedLens.project.production.shots.filter((candidate) => candidate.enabled && !candidate.rejected).every((candidate) => normalizedLens.project.scene.cameras.find((camera) => camera.id === candidate.cameraId)?.focalLength === 50), "Lens continuity normalization failed.");
  cover("director-continuity-normalize-lens");
  project = normalizedLens.project;
  const eyelines = alignDialogueEyelines(project, first.id, second.id);
  assert(eyelines.changed && eyelines.affectedShotIds.length >= 2, "Dialogue eyeline alignment did not update coverage cameras.");
  cover("director-continuity-eyelines");
  project = eyelines.project;
  const intentional = markIntentionalAxisCrossing(project, project.production.shots[0].id);
  assert(intentional.changed && intentional.project.production.shots[0].reviewTags.includes("intentional-axis-crossing"), "Intentional axis crossing was not marked on the shot.");
  cover("director-continuity-mark-intentional");
  project = intentional.project;

  const approvedShotIds = project.production.shots.filter((candidate) => candidate.enabled && candidate.activeTake).slice(0, 2).map((candidate) => candidate.id);
  project = {
    ...project,
    production: {
      ...project.production,
      activeShotId: approvedShotIds[0] ?? project.production.activeShotId,
      shots: project.production.shots.map((candidate) => approvedShotIds.includes(candidate.id)
        ? { ...candidate, approved: true, status: "approved" as const }
        : candidate)
    }
  };
  const previewPlan = buildStudioRenderPlan(project, "preview", "approved");
  assert(previewPlan.jobs.length === approvedShotIds.length, "Preview render plan did not create one beauty job per approved active shot.");
  assert(previewPlan.jobs.every((job) => job.settings.format === "webm_video" && job.settings.quality === "draft" && job.settings.width === 960), "Preview render plan did not apply its lightweight profile.");
  cover("director-render-plan-preview");
  const finalPlan = buildStudioRenderPlan(project, "final", "approved");
  assert(finalPlan.jobs.length >= previewPlan.jobs.length * 3, "Final render plan did not preserve production passes.");
  assert(finalPlan.jobs.every((job) => job.settings.format === "png_sequence" && job.settings.quality === "high"), "Final render plan did not apply lossless sequence settings.");
  cover("director-render-plan-final");
  const compositingPlan = buildStudioRenderPlan(project, "compositing", "selected");
  assert(compositingPlan.jobs.length >= 3 && compositingPlan.jobs.every((job) => !job.settings.includeAudio), "Compositing render plan did not create silent image-sequence passes.");
  cover("director-render-plan-compositing");

  const queued = enqueueStudioRenderPlan(project, finalPlan);
  assert(queued.changed && queued.affectedJobIds.length === finalPlan.jobs.length, "Studio render plan was not added to the project queue.");
  cover("director-render-enqueue-plan");
  project = queued.project;
  const duplicateAttempt = enqueueStudioRenderPlan(project, finalPlan);
  assert(!duplicateAttempt.changed && duplicateAttempt.affectedJobIds.length === 0, "Studio render enqueue did not prevent duplicate jobs.");
  const duplicatedProject = { ...project, renderQueue: { ...project.renderQueue, jobs: [...project.renderQueue.jobs, { ...project.renderQueue.jobs[0], id: "render_duplicate_acceptance" }] } };
  const deduplicated = deduplicateProductionRenderQueue(duplicatedProject);
  assert(deduplicated.changed && !deduplicated.project.renderQueue.jobs.some((job) => job.id === "render_duplicate_acceptance"), "Render queue deduplication did not remove an equivalent job.");
  cover("director-render-deduplicate");
  project = deduplicated.project;

  const reversedProject = { ...project, renderQueue: { ...project.renderQueue, jobs: [...project.renderQueue.jobs].reverse() } };
  const sortedQueue = sortProductionRenderQueue(reversedProject);
  assert(sortedQueue.changed && sortedQueue.project.renderQueue.jobs[0].production?.shotId === approvedShotIds[0], "Production render queue was not sorted by shot chronology.");
  cover("director-render-sort");
  project = sortedQueue.project;
  const prioritized = prioritizeActiveShotRenderJobs({ ...project, renderQueue: { ...project.renderQueue, jobs: [...project.renderQueue.jobs].reverse() } });
  assert(prioritized.changed && prioritized.project.renderQueue.jobs[0].production?.shotId === project.production.activeShotId, "Active-shot render jobs were not prioritized.");
  cover("director-render-prioritize-active");
  project = prioritized.project;

  const estimate = estimateProductionRenderQueue(project.renderQueue);
  assert(estimate.jobs === project.renderQueue.jobs.length && estimate.frames > 0 && estimate.pixelSamples > estimate.frames, "Production render estimate is incomplete.");
  cover("director-render-estimate");
  const manifest = JSON.parse(createStudioRenderQueueManifest(project)) as { schemaVersion: number; jobs: unknown[]; estimate: { jobs: number } };
  assert(manifest.schemaVersion === 1 && manifest.jobs.length === project.renderQueue.jobs.length && manifest.estimate.jobs === project.renderQueue.jobs.length, "Render queue manifest did not describe the current queue.");
  cover("director-render-manifest");

  const failedId = project.renderQueue.jobs[0].id;
  project = {
    ...project,
    renderQueue: {
      ...project.renderQueue,
      jobs: project.renderQueue.jobs.map((job) => job.id === failedId ? { ...job, status: "error" as const, progress: 0.7, error: "Encoder failed" } : job)
    }
  };
  const retried = retryFailedProductionJobs(project);
  assert(retried.changed && retried.project.renderQueue.jobs.find((job) => job.id === failedId)?.status === "queued", "Failed production job was not requeued.");
  cover("director-render-retry-failed");
  project = retried.project;
  const cancelled = cancelQueuedProductionJobs(project);
  assert(cancelled.changed && cancelled.project.renderQueue.jobs.filter((job) => job.production).every((job) => job.status === "cancelled"), "Queued production jobs were not cancelled.");
  cover("director-render-cancel-queued");
  project = cancelled.project;

  const staleShotId = approvedShotIds[0];
  project = { ...project, production: { ...project.production, shots: project.production.shots.map((candidate) => candidate.id === staleShotId ? { ...candidate, revision: candidate.revision + 1 } : candidate) } };
  const staleRemoved = removeStaleProductionJobs(project);
  assert(staleRemoved.changed && staleRemoved.project.renderQueue.jobs.every((job) => job.production?.shotId !== staleShotId), "Stale production jobs were not removed after a shot revision.");
  cover("director-render-remove-stale");
  project = staleRemoved.project;

  const refreshed = queueStudioRenders(project, "preview", "approved");
  assert(refreshed.changed && refreshed.affectedJobIds.length >= 1, "High-level studio render queue action did not add preview jobs.");
  cover("director-render-queue-action");
  project = refreshed.project;
  const currentShot = project.production.shots.find((candidate) => candidate.id === staleShotId)!;
  project = { ...project, production: { ...project.production, shots: project.production.shots.map((candidate) => candidate.id === staleShotId ? { ...candidate, startFrame: candidate.startFrame + 2, endFrame: candidate.endFrame + 2 } : candidate) } };
  const synchronized = synchronizeQueuedJobsToShots(project);
  assert(synchronized.changed && synchronized.project.renderQueue.jobs.filter((job) => job.production?.shotId === staleShotId).every((job) => job.settings.startFrame === currentShot.startFrame + 2), "Queued render jobs did not synchronize to edited shot ranges.");
  cover("director-render-sync-shots");

  const qualitySource = synchronized.project;
  const qualityShots = qualitySource.production.shots.filter((candidate) => candidate.enabled && candidate.activeTake && !candidate.rejected);
  const degradedQualityProject: MineMotionProject = {
    ...qualitySource,
    scene: {
      ...qualitySource.scene,
      lights: [],
      cameras: qualitySource.scene.cameras.map((camera) => ({
        ...camera,
        metadata: Object.fromEntries(Object.entries(camera.metadata).filter(([key]) => !["cinemaProfileId", "sensorWidthMm", "focusTargetId", "focusDistance"].includes(key)))
      }))
    },
    lighting: { ...qualitySource.lighting, shadowsEnabled: false, ambientIntensity: 1.8 },
    production: {
      ...qualitySource.production,
      shots: qualitySource.production.shots.map((candidate) => qualityShots.some((shot) => shot.id === candidate.id)
        ? { ...candidate, approved: true, rating: Math.max(1, candidate.rating), renderPasses: candidate.renderPasses.includes("beauty") ? candidate.renderPasses : ["beauty", ...candidate.renderPasses], outputName: candidate.outputName || candidate.name.replace(/\s+/g, "_") }
        : candidate)
    }
  };

  const qualityReport = analyzeStudioQuality(degradedQualityProject);
  assert(qualityReport.categories.length === 6 && qualityReport.overallScore < 85 && qualityReport.issues.length >= 2, "Studio quality report did not detect a deliberately degraded project.");
  assert(qualityReport.worstShotId !== null && qualityReport.shots.length === qualityShots.length, "Studio quality report did not rank active shots.");
  cover("director-quality-overall");

  const cameraQuality = evaluateCameraQuality(degradedQualityProject);
  assert(cameraQuality.id === "camera" && cameraQuality.issues.some((entry) => entry.id.startsWith("camera-profile")), "Camera quality evaluator did not detect missing physical profiles.");
  cover("director-quality-camera");
  const takeQuality = evaluateTakeQuality(degradedQualityProject.production.shots.filter((candidate) => candidate.enabled && !candidate.rejected).map((candidate) => ({ ...candidate, approved: false })));
  assert(takeQuality.id === "takes" && takeQuality.issues.some((entry) => entry.id.startsWith("take-approved")), "Take quality evaluator did not detect unapproved take groups.");
  cover("director-quality-takes");
  const lightingQuality = evaluateLightingQuality(degradedQualityProject);
  assert(lightingQuality.id === "lighting" && lightingQuality.issues.some((entry) => entry.id === "lighting-empty"), "Lighting quality evaluator did not detect an unlit scene.");
  cover("director-quality-lighting");
  const continuityQuality = evaluateContinuityQuality(degradedQualityProject);
  assert(continuityQuality.id === "continuity" && continuityQuality.total === qualityShots.length, "Continuity quality evaluator did not inspect the active sequence.");
  cover("director-quality-continuity");
  const audioQuality = evaluateAudioQuality(degradedQualityProject);
  assert(audioQuality.id === "audio" && audioQuality.total >= 1, "Audio quality evaluator did not inspect the film timeline.");
  cover("director-quality-audio");
  const renderQuality = evaluateRenderQuality(degradedQualityProject);
  assert(renderQuality.id === "render" && renderQuality.total === qualityShots.length, "Render quality evaluator did not inspect shot outputs.");
  cover("director-quality-render");
  const snapshots = buildShotQualitySnapshots(degradedQualityProject);
  assert(snapshots.length === qualityShots.length && snapshots.every((snapshot) => snapshot.score >= 0 && snapshot.score <= 100), "Shot readiness snapshots are incomplete.");
  cover("director-quality-shot-readiness");

  const alternateShot = qualityShots.find((candidate) => candidate.id !== qualityReport.worstShotId);
  const selectionInput = alternateShot
    ? { ...degradedQualityProject, production: { ...degradedQualityProject.production, activeShotId: alternateShot.id } }
    : degradedQualityProject;
  const selectedWorst = selectLowestQualityShot(selectionInput);
  assert(selectedWorst.project.production.activeShotId === qualityReport.worstShotId, "Lowest-quality shot selection did not focus the weakest shot.");
  cover("director-quality-select-worst");

  const polishedQuality = autoPolishStudioProject(degradedQualityProject);
  assert(polishedQuality.changed && polishedQuality.actions.length >= 3, "Studio auto-polish did not apply corrective actions.");
  assert(polishedQuality.report.overallScore > qualityReport.overallScore, "Studio auto-polish did not improve the quality score.");
  assert(polishedQuality.project.scene.lights.some((light) => light.visible && light.intensity > 0), "Studio auto-polish did not create rendered lighting.");
  cover("director-quality-auto-polish");

  const readyInput: MineMotionProject = {
    ...polishedQuality.project,
    production: {
      ...polishedQuality.project.production,
      shots: polishedQuality.project.production.shots.map((candidate) => candidate.enabled && candidate.activeTake && !candidate.rejected
        ? { ...candidate, approved: true, status: "planned" as const }
        : candidate)
    }
  };
  const markedReady = markQualityReadyShots(readyInput, 60);
  assert(markedReady.changed && markedReady.project.production.shots.some((candidate) => candidate.status === "ready"), "Quality-ready shots were not promoted to ready status.");
  cover("director-quality-mark-ready");
  const qualityMarkdown = createStudioQualityReportMarkdown(markedReady.project);
  assert(qualityMarkdown.includes("Studio quality report") && qualityMarkdown.includes("## Categories") && qualityMarkdown.includes("## Shot readiness"), "Studio quality Markdown report is incomplete.");
  cover("director-quality-export");

  let variantProject = markedReady.project;
  const variantShot = variantProject.production.shots.find((candidate) => candidate.enabled && candidate.activeTake && !candidate.rejected)!;
  const variantCamera = variantProject.scene.cameras.find((candidate) => candidate.id === variantShot.cameraId)!;
  const capturedBase = captureShotCreativeVariant(variantProject, variantShot.id, "Balanced master");
  assert(capturedBase.changed && capturedBase.variantId && capturedBase.project.production.shots.find((candidate) => candidate.id === variantShot.id)?.creativeVariants.length === 1, "Creative variant capture did not persist a shot look.");
  cover("director-variant-capture");
  variantProject = capturedBase.project;
  const baseVariantId = capturedBase.variantId!;

  variantProject = renameShotCreativeVariant(variantProject, variantShot.id, baseVariantId, "Balanced hero").project;
  assert(variantProject.production.shots.find((candidate) => candidate.id === variantShot.id)?.creativeVariants[0].name === "Balanced hero", "Creative variant rename was not persisted.");
  cover("director-variant-rename");
  variantProject = annotateShotCreativeVariant(variantProject, variantShot.id, baseVariantId, "Safe continuity and natural contrast.").project;
  assert(variantProject.production.shots.find((candidate) => candidate.id === variantShot.id)?.creativeVariants[0].notes.includes("natural contrast"), "Creative variant notes were not persisted.");
  cover("director-variant-annotate");
  variantProject = rateShotCreativeVariant(variantProject, variantShot.id, baseVariantId, 3.5).project;
  assert(variantProject.production.shots.find((candidate) => candidate.id === variantShot.id)?.creativeVariants[0].rating === 3.5, "Creative variant rating was not persisted.");
  cover("director-variant-rate");

  variantProject = {
    ...variantProject,
    scene: {
      ...variantProject.scene,
      cameras: variantProject.scene.cameras.map((camera) => camera.id === variantCamera.id ? { ...camera, focalLength: 85, fov: 24, metadata: { ...camera.metadata, creativeTest: "dramatic" } } : camera)
    },
    lighting: { ...variantProject.lighting, ambientIntensity: 0.35 }
  };
  const capturedDramatic = captureShotCreativeVariant(variantProject, variantShot.id, "Dramatic portrait");
  assert(capturedDramatic.changed && capturedDramatic.variantId !== baseVariantId, "Second creative variant was not captured independently.");
  variantProject = rateShotCreativeVariant(capturedDramatic.project, variantShot.id, capturedDramatic.variantId!, 5).project;
  const comparisons = compareShotCreativeVariants(variantProject, variantShot.id);
  assert(comparisons.length === 2 && comparisons.some((entry) => entry.focalLength === 85 && entry.rating === 5), "Creative variant comparison did not expose artistic differences.");
  cover("director-variant-compare");

  const appliedBase = applyShotCreativeVariant(variantProject, variantShot.id, baseVariantId);
  assert(appliedBase.changed && appliedBase.project.scene.cameras.find((camera) => camera.id === variantCamera.id)?.focalLength !== 85, "Applying a creative variant did not restore its camera snapshot.");
  assert(appliedBase.project.production.shots.find((candidate) => candidate.id === variantShot.id)?.activeVariantId === baseVariantId, "Applied creative variant was not marked active.");
  cover("director-variant-apply");
  variantProject = appliedBase.project;

  variantProject = { ...variantProject, scene: { ...variantProject.scene, cameras: variantProject.scene.cameras.map((camera) => camera.id === variantCamera.id ? { ...camera, focalLength: 40 } : camera) } };
  const updatedBase = updateShotCreativeVariant(variantProject, variantShot.id, baseVariantId);
  assert(updatedBase.changed && updatedBase.project.production.shots.find((candidate) => candidate.id === variantShot.id)?.creativeVariants.find((variant) => variant.id === baseVariantId)?.camera.focalLength === 40, "Creative variant update did not recapture the current camera.");
  cover("director-variant-update");
  variantProject = updatedBase.project;

  const duplicatedVariant = duplicateShotCreativeVariant(variantProject, variantShot.id, capturedDramatic.variantId!);
  assert(duplicatedVariant.changed && duplicatedVariant.project.production.shots.find((candidate) => candidate.id === variantShot.id)?.creativeVariants.length === 3, "Creative variant duplication did not create an independent version.");
  cover("director-variant-duplicate");
  variantProject = duplicatedVariant.project;
  const chosenVariant = chooseHighestRatedShotVariant(variantProject, variantShot.id);
  assert(chosenVariant.changed && chosenVariant.project.production.shots.find((candidate) => candidate.id === variantShot.id)?.activeVariantId === capturedDramatic.variantId, "Highest-rated creative variant was not applied.");
  assert(chosenVariant.project.scene.cameras.find((camera) => camera.id === variantCamera.id)?.focalLength === 85, "Highest-rated creative variant did not restore its camera lens.");
  cover("director-variant-choose-best");
  variantProject = chosenVariant.project;

  const deletedVariant = deleteShotCreativeVariant(variantProject, variantShot.id, duplicatedVariant.variantId!);
  assert(deletedVariant.changed && deletedVariant.project.production.shots.find((candidate) => candidate.id === variantShot.id)?.creativeVariants.length === 2, "Creative variant deletion did not remove the selected version.");
  cover("director-variant-delete");
  variantProject = deletedVariant.project;
  const variantManifest = JSON.parse(createShotVariantManifest(variantProject, variantShot.id)) as { variants: unknown[]; activeVariantId: string | null };
  assert(variantManifest.variants.length === 2 && variantManifest.activeVariantId === capturedDramatic.variantId, "Creative variant manifest is incomplete.");
  cover("director-variant-manifest");
  const reloadedVariants = sanitizeProductionData(JSON.parse(JSON.stringify(variantProject.production)) as unknown, variantProject);
  assert(reloadedVariants.shots.find((candidate) => candidate.id === variantShot.id)?.creativeVariants.length === 2, "Creative variants did not survive project serialization.");

  return { project: { ...variantProject, production: reloadedVariants }, studioFeatures: 99 };
}
