import { MINECRAFT_CREATION_FEATURE_SEEDS } from "../../minecraft/studio/MinecraftCreationFeatureRegistry";
import { ANIMATION_POLISH_ACTIONS } from "./AnimationPolish";
import { CINEMA_CAMERA_PROFILES, PROFESSIONAL_CAMERA_MOVES } from "./ProfessionalCamera";
import { STUDIO_LIGHTING_RIGS } from "./StudioLightingRigs";
import { ACTOR_ACTION_KINDS } from "./ActorChoreography";
import { ACTOR_FORMATIONS } from "./ActorBlocking";
import { CINEMATIC_BEAT_PRESETS } from "./CinematicBeatPresets";
import { CINEMATIC_EVENT_KINDS } from "./CinematicEvents";
import { ENVIRONMENT_TRANSITION_KINDS } from "./EnvironmentDirection";
import { FILM_LOOKS } from "./FilmLook";
import { MINECRAFT_ACTOR_ACTIONS } from "./MinecraftActorActions";
import { SHOT_TRANSITION_KINDS } from "./ShotTransitions";
import { DIRECTOR_SHOT_KINDS } from "./ShotRecipes";
import { SOUND_DESIGN_BEATS } from "./SoundDesign";

export interface DirectorFeaturePhase {
  phase: number;
  id: string;
  title: string;
  sourceOwner: string;
  acceptanceId: string;
}

type FeatureSeed = Omit<DirectorFeaturePhase, "phase">;

const seeds: FeatureSeed[] = [
  ...DIRECTOR_SHOT_KINDS.map((kind) => feature(`shot.${kind}`, `Shot recipe: ${kind}`, "ShotRecipes.ts", `director-shot-${kind}`)),
  feature("sequence.dialogue", "Six-shot dialogue sequence", "DialogueDirector.ts", "director-sequence-dialogue"),
  feature("sequence.action", "Seven-shot action sequence", "ActionDirector.ts", "director-sequence-action"),
  feature("sequence.showcase", "Five-shot character showcase", "ShowcaseDirector.ts", "director-sequence-showcase"),
  feature("sequence.runtime-cut", "Runtime production camera cuts", "ShotRuntime.ts", "director-runtime-camera-cut"),
  feature("sequence.camera-lane", "Automatic Camera Cuts timeline lane", "src/project/ProjectStore.ts", "director-camera-cut-lane"),
  feature("sequence.storyboard-sync", "Storyboard synchronization", "StoryboardSync.ts", "director-storyboard-sync"),
  feature("sequence.analysis", "Shot gap, overlap and coverage analysis", "SequenceAnalysis.ts", "director-sequence-analysis"),
  feature("editing.split", "Split shot at playhead", "ShotEditing.ts", "director-edit-split"),
  feature("editing.duplicate-take", "Duplicate shot with independent camera take", "ShotEditing.ts", "director-edit-duplicate-take"),
  feature("editing.move", "Move shot with camera keyframes", "ShotEditing.ts", "director-edit-move"),
  feature("editing.close-gaps", "Close active shot gaps", "ShotEditing.ts", "director-edit-close-gaps"),
  feature("editing.ripple-delete", "Ripple-delete shot and orphan camera", "ShotEditing.ts", "director-edit-ripple-delete"),
  ...FILM_LOOKS.map((look) => feature(`look.${look.id}`, `Film look: ${look.name}`, "FilmLook.ts", `director-look-${look.id}`)),
  feature("starter.cast", "Automatic minimum film cast", "FilmStarter.ts", "director-starter-cast"),
  feature("starter.complete", "One-click complete film starter", "FilmStarter.ts", "director-starter-complete"),
  ...ACTOR_ACTION_KINDS.map((kind) => feature(`actor.${kind}`, `Actor choreography: ${kind}`, "ActorChoreography.ts", `director-actor-${kind}`)),
  feature("actor.fight-beat", "Two-actor fight choreography beat", "ActorChoreography.ts", "director-actor-fight-beat"),
  feature("actor.walk-talk", "Two-actor walk-and-talk choreography", "ActorChoreography.ts", "director-actor-walk-talk"),
  ...CINEMATIC_EVENT_KINDS.map((kind) => feature(`event.${kind}`, `Cinematic event: ${kind}`, "CinematicEvents.ts", `director-event-${kind}`)),
  feature("dialogue.parse", "Speaker-labelled dialogue script parser", "DialoguePerformance.ts", "director-dialogue-parse"),
  feature("dialogue.timing", "Automatic dialogue line timing", "DialoguePerformance.ts", "director-dialogue-timing"),
  feature("dialogue.placeholders", "Dialogue recording placeholder clips", "DialoguePerformance.ts", "director-dialogue-placeholders"),
  feature("dialogue.lipsync", "Text-derived lip-sync cue generation", "DialoguePerformance.ts", "director-dialogue-lipsync"),
  feature("dialogue.performance", "Speaker and listener performance blocking", "DialoguePerformance.ts", "director-dialogue-performance"),
  feature("dialogue.cameras", "Automatic dialogue camera coverage", "DialoguePerformance.ts", "director-dialogue-cameras"),
  ...CINEMATIC_BEAT_PRESETS.map((preset) => feature(`beat.${preset}`, `Story beat: ${preset}`, "CinematicBeatPresets.ts", `director-beat-${preset}`)),
  feature("camera.handheld", "Deterministic handheld camera motion", "CameraPathEditing.ts", "director-camera-handheld"),
  feature("camera.smooth", "Camera path smoothing", "CameraPathEditing.ts", "director-camera-smooth"),
  feature("camera.reverse", "Reverse animated camera move", "CameraPathEditing.ts", "director-camera-reverse"),
  feature("camera.retime", "Retime shot with camera keyframes", "CameraPathEditing.ts", "director-camera-retime"),
  ...SHOT_TRANSITION_KINDS.map((kind) => feature(`transition.${kind}`, `Shot transition: ${kind}`, "ShotTransitions.ts", `director-transition-${kind}`)),
  feature("preflight.inspect", "Film project preflight", "FilmPreflight.ts", "director-preflight-inspect"),
  feature("preflight.repair", "One-click film project repair", "FilmPreflight.ts", "director-preflight-repair"),
  feature("document.shot-list", "CSV shot-list export", "ProductionDocuments.ts", "director-document-shot-list"),
  feature("document.edl", "Edit decision list export", "ProductionDocuments.ts", "director-document-edl"),
  feature("document.storyboard", "Storyboard Markdown export", "ProductionDocuments.ts", "director-document-storyboard"),
  feature("document.dialogue", "Dialogue recording script export", "ProductionDocuments.ts", "director-document-dialogue"),
  feature("document.manifest", "Production manifest JSON export", "ProductionDocuments.ts", "director-document-manifest"),
  ...ENVIRONMENT_TRANSITION_KINDS.map((kind) => feature(`environment.${kind}`, `Environment transition: ${kind}`, "EnvironmentDirection.ts", `director-environment-${kind}`)),
  ...SOUND_DESIGN_BEATS.map((beat) => feature(`sound.${beat}`, `Sound-design beat: ${beat}`, "SoundDesign.ts", `director-sound-${beat}`)),
  ...ACTOR_FORMATIONS.map((formation) => feature(`formation.${formation}`, `Actor formation: ${formation}`, "ActorBlocking.ts", `director-formation-${formation}`)),
  ...MINECRAFT_ACTOR_ACTIONS.map((kind) => feature(`minecraft-action.${kind}`, `Minecraft actor action: ${kind}`, "MinecraftActorActions.ts", `director-minecraft-action-${kind}`)),
  ...CINEMA_CAMERA_PROFILES.map((profile) => feature(`camera-profile.${profile.id}`, `Cinema camera profile: ${profile.name}`, "ProfessionalCamera.ts", `director-camera-profile-${profile.id}`)),
  ...PROFESSIONAL_CAMERA_MOVES.map((move) => feature(`camera-move.${move}`, `Professional camera move: ${move}`, "ProfessionalCamera.ts", `director-camera-move-${move}`)),
  feature("camera.focus-target", "Persistent subject focus target", "ProfessionalCamera.ts", "director-camera-focus-target"),
  feature("camera.auto-frame", "Automatic multi-subject framing", "ProfessionalCamera.ts", "director-camera-auto-frame"),
  feature("camera.subject-tracking", "Animated subject tracking", "ProfessionalCamera.ts", "director-camera-subject-tracking"),
  feature("camera.horizon-stabilize", "Shot horizon stabilization", "ProfessionalCamera.ts", "director-camera-horizon-stabilize"),
  feature("take.rate", "Half-star take rating", "TakeReview.ts", "director-take-rate"),
  feature("take.favorite", "Favorite take toggle", "TakeReview.ts", "director-take-favorite"),
  feature("take.reject", "Reject take with reason", "TakeReview.ts", "director-take-reject"),
  feature("take.restore", "Restore rejected take", "TakeReview.ts", "director-take-restore"),
  feature("take.approve", "Approve and activate take", "TakeReview.ts", "director-take-approve"),
  feature("take.choose-best", "Choose highest-rated take", "TakeReview.ts", "director-take-choose-best"),
  feature("take.note", "Persistent take review notes", "TakeReview.ts", "director-take-note"),
  feature("take.tag-add", "Add normalized review tag", "TakeReview.ts", "director-take-tag-add"),
  feature("take.tag-remove", "Remove review tag", "TakeReview.ts", "director-take-tag-remove"),
  feature("take.revision", "Increment take revision", "TakeReview.ts", "director-take-revision"),
  feature("take.normalize-names", "Normalize take naming", "TakeReview.ts", "director-take-normalize-names"),
  feature("take.compare", "Structured take comparison", "TakeReview.ts", "director-take-compare"),
  feature("batch.sort", "Sort shots chronologically", "ShotBatchTools.ts", "director-batch-sort"),
  feature("batch.rename", "Sequential shot renaming", "ShotBatchTools.ts", "director-batch-rename"),
  feature("batch.output", "Normalize shot output paths", "ShotBatchTools.ts", "director-batch-output"),
  feature("batch.handles", "Apply render handles", "ShotBatchTools.ts", "director-batch-handles"),
  feature("batch.status", "Batch shot status", "ShotBatchTools.ts", "director-batch-status"),
  feature("batch.passes", "Batch render passes", "ShotBatchTools.ts", "director-batch-passes"),
  feature("batch.approved-only", "Enable only approved takes", "ShotBatchTools.ts", "director-batch-approved-only"),
  feature("batch.trim-timeline", "Trim timeline to active shots", "ShotBatchTools.ts", "director-batch-trim-timeline"),
  ...STUDIO_LIGHTING_RIGS.map((rig) => feature(`lighting.${rig}`, `Rendered studio lighting rig: ${rig}`, "StudioLightingRigs.ts", `director-lighting-${rig}`)),
  feature("lighting.remove", "Remove generated studio lighting", "StudioLightingRigs.ts", "director-lighting-remove"),
  ...ANIMATION_POLISH_ACTIONS.map((action) => feature(`polish.${action}`, `Animation polish: ${action}`, "AnimationPolish.ts", `director-polish-${action}`)),
  feature("continuity.analyze", "Sequence continuity analysis", "ContinuityDirector.ts", "director-continuity-analyze"),
  feature("continuity.repair-axis", "Repair 180-degree axis crossing", "ContinuityDirector.ts", "director-continuity-repair-axis"),
  feature("continuity.normalize-lens", "Normalize sequence lens continuity", "ContinuityDirector.ts", "director-continuity-normalize-lens"),
  feature("continuity.eyelines", "Align dialogue eyelines", "ContinuityDirector.ts", "director-continuity-eyelines"),
  feature("continuity.mark-intentional", "Mark intentional axis crossing", "ContinuityDirector.ts", "director-continuity-mark-intentional"),
  feature("render.plan-preview", "Preview render plan for approved shots", "StudioRenderPipeline.ts", "director-render-plan-preview"),
  feature("render.plan-final", "Final image-sequence render plan", "StudioRenderPipeline.ts", "director-render-plan-final"),
  feature("render.plan-compositing", "Multilayer compositing render plan", "StudioRenderPipeline.ts", "director-render-plan-compositing"),
  feature("render.enqueue-plan", "Deduplicated studio render enqueue", "StudioRenderPipeline.ts", "director-render-enqueue-plan"),
  feature("render.deduplicate", "Render queue duplicate removal", "StudioRenderPipeline.ts", "director-render-deduplicate"),
  feature("render.sort", "Shot-ordered production render queue", "StudioRenderPipeline.ts", "director-render-sort"),
  feature("render.prioritize-active", "Active-shot queue prioritization", "StudioRenderPipeline.ts", "director-render-prioritize-active"),
  feature("render.estimate", "Production render workload estimate", "StudioRenderPipeline.ts", "director-render-estimate"),
  feature("render.manifest", "Render queue manifest export", "StudioRenderPipeline.ts", "director-render-manifest"),
  feature("render.retry-failed", "Retry failed production renders", "StudioRenderPipeline.ts", "director-render-retry-failed"),
  feature("render.cancel-queued", "Cancel queued production renders", "StudioRenderPipeline.ts", "director-render-cancel-queued"),
  feature("render.remove-stale", "Remove stale shot revisions from queue", "StudioRenderPipeline.ts", "director-render-remove-stale"),
  feature("render.queue-action", "One-step studio render queue action", "StudioRenderPipeline.ts", "director-render-queue-action"),
  feature("render.sync-shots", "Synchronize queued jobs to edited shots", "StudioRenderPipeline.ts", "director-render-sync-shots"),
  feature("quality.overall", "Holistic studio quality report", "StudioQualityControl.ts", "director-quality-overall"),
  feature("quality.camera", "Per-shot camera quality evaluation", "StudioQualityControl.ts", "director-quality-camera"),
  feature("quality.takes", "Take approval and review quality evaluation", "StudioQualityControl.ts", "director-quality-takes"),
  feature("quality.lighting", "Rendered lighting quality evaluation", "StudioQualityControl.ts", "director-quality-lighting"),
  feature("quality.continuity", "Sequence continuity quality evaluation", "StudioQualityControl.ts", "director-quality-continuity"),
  feature("quality.audio", "Timeline audio quality evaluation", "StudioQualityControl.ts", "director-quality-audio"),
  feature("quality.render", "Shot render readiness evaluation", "StudioQualityControl.ts", "director-quality-render"),
  feature("quality.shot-readiness", "Per-shot readiness scoring", "StudioQualityControl.ts", "director-quality-shot-readiness"),
  feature("quality.select-worst", "Focus the lowest-quality shot", "StudioQualityControl.ts", "director-quality-select-worst"),
  feature("quality.auto-polish", "One-click studio quality auto-polish", "StudioQualityControl.ts", "director-quality-auto-polish"),
  feature("quality.mark-ready", "Promote quality-approved shots to ready", "StudioQualityControl.ts", "director-quality-mark-ready"),
  feature("quality.export", "Studio quality Markdown report export", "StudioQualityControl.ts", "director-quality-export"),
  feature("variant.capture", "Capture non-destructive shot creative variant", "ShotCreativeVariants.ts", "director-variant-capture"),
  feature("variant.update", "Recapture an existing shot creative variant", "ShotCreativeVariants.ts", "director-variant-update"),
  feature("variant.apply", "Apply camera, lighting and post variant", "ShotCreativeVariants.ts", "director-variant-apply"),
  feature("variant.duplicate", "Duplicate a shot creative variant", "ShotCreativeVariants.ts", "director-variant-duplicate"),
  feature("variant.rename", "Rename a shot creative variant", "ShotCreativeVariants.ts", "director-variant-rename"),
  feature("variant.annotate", "Annotate a shot creative variant", "ShotCreativeVariants.ts", "director-variant-annotate"),
  feature("variant.rate", "Rate a shot creative variant", "ShotCreativeVariants.ts", "director-variant-rate"),
  feature("variant.choose-best", "Apply highest-rated shot variant", "ShotCreativeVariants.ts", "director-variant-choose-best"),
  feature("variant.compare", "Compare shot creative variants", "ShotCreativeVariants.ts", "director-variant-compare"),
  feature("variant.delete", "Delete a shot creative variant", "ShotCreativeVariants.ts", "director-variant-delete"),
  feature("variant.manifest", "Export shot creative variant manifest", "ShotCreativeVariants.ts", "director-variant-manifest"),
  ...MINECRAFT_CREATION_FEATURE_SEEDS
];

export const DIRECTOR_FEATURE_PHASES: readonly DirectorFeaturePhase[] = Object.freeze(
  seeds.map((seed, index) => Object.freeze({ phase: 601 + index, ...seed }))
);

export const DIRECTOR_FIRST_REAL_PHASE = DIRECTOR_FEATURE_PHASES[0].phase;
export const DIRECTOR_LAST_REAL_PHASE = DIRECTOR_FEATURE_PHASES.at(-1)!.phase;

function feature(id: string, title: string, sourceOwner: string, acceptanceId: string): FeatureSeed {
  return {
    id,
    title,
    sourceOwner: sourceOwner.startsWith("src/") ? sourceOwner : `src/production/director/${sourceOwner}`,
    acceptanceId
  };
}
