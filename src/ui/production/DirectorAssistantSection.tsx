import { useMemo, useState } from "react";
import { Camera, Film, MessageSquare, Sparkles, Swords } from "lucide-react";
import { StudioProSection } from "./StudioProSection";
import { MinecraftCreationSuiteSection } from "./MinecraftCreationSuiteSection";
import type { MineMotionProject } from "../../project/ProjectFile";
import { downloadBrowserBlob } from "../../export/BrowserDownload";
import { useLocalization } from "../../localization/LocalizationContext";
import { createActionSequenceBlueprint } from "../../production/director/ActionDirector";
import {
  ACTOR_ACTION_KINDS,
  applyActorAction,
  createFightBeat,
  createWalkAndTalk,
  type ActorActionKind
} from "../../production/director/ActorChoreography";
import { applyFilmLook, FILM_LOOKS, type FilmLookId } from "../../production/director/FilmLook";
import {
  applyCinematicEvent,
  CINEMATIC_EVENT_KINDS,
  type CinematicEventKind
} from "../../production/director/CinematicEvents";
import {
  CINEMATIC_BEAT_PRESETS,
  createCinematicBeat,
  labelForBeat,
  type CinematicBeatPreset
} from "../../production/director/CinematicBeatPresets";
import {
  addHandheldCameraMotion,
  retimeShotWithCamera,
  reverseCameraMove,
  smoothCameraPath
} from "../../production/director/CameraPathEditing";
import {
  applyShotTransition,
  SHOT_TRANSITION_KINDS,
  type ShotTransitionKind
} from "../../production/director/ShotTransitions";
import { createFilmStarter } from "../../production/director/FilmStarter";
import { buildDirectorSequence } from "../../production/director/DirectorSequenceBuilder";
import { prepareDialogueSequence } from "../../production/director/DialogueDirector";
import { createScriptedDialogueScene } from "../../production/director/DialoguePerformance";
import { analyzeProductionSequence } from "../../production/director/SequenceAnalysis";
import { autoRepairFilmProject, inspectFilmProject } from "../../production/director/FilmPreflight";
import {
  createDialogueRecordingScript,
  createEditDecisionList,
  createProductionManifest,
  createShotListCsv,
  createStoryboardMarkdown,
  type ProductionTextArtifact
} from "../../production/director/ProductionDocuments";
import {
  createEnvironmentTransition,
  ENVIRONMENT_TRANSITION_KINDS,
  type EnvironmentTransitionKind
} from "../../production/director/EnvironmentDirection";
import {
  createSoundDesignBeat,
  labelForSoundBeat,
  SOUND_DESIGN_BEATS,
  type SoundDesignBeat
} from "../../production/director/SoundDesign";
import {
  ACTOR_FORMATIONS,
  stageActorFormation,
  type ActorFormation
} from "../../production/director/ActorBlocking";
import {
  applyMinecraftActorAction,
  MINECRAFT_ACTOR_ACTIONS,
  type MinecraftActorAction
} from "../../production/director/MinecraftActorActions";
import {
  closeSequenceGaps,
  duplicateDirectedShotAsTake,
  rippleDeleteShot,
  splitProductionShot
} from "../../production/director/ShotEditing";
import { createShowcaseSequenceBlueprint } from "../../production/director/ShowcaseDirector";
import {
  DIRECTOR_SHOT_KINDS,
  labelForKind,
  type DirectorShotKind
} from "../../production/director/ShotRecipes";

interface DirectorAssistantSectionProps {
  project: MineMotionProject;
  onProjectChange: (project: MineMotionProject, label: string) => void;
}

type DirectorMode = "dialogue" | "action" | "showcase";

export function DirectorAssistantSection({
  project,
  onProjectChange
}: DirectorAssistantSectionProps) {
  const { t } = useLocalization();
  const characters = project.scene.characters;
  const [mode, setMode] = useState<DirectorMode>("dialogue");
  const [primaryId, setPrimaryId] = useState(characters[0]?.id ?? "");
  const [secondaryId, setSecondaryId] = useState(characters[1]?.id ?? characters[0]?.id ?? "");
  const [replaceGenerated, setReplaceGenerated] = useState(false);
  const [stageActors, setStageActors] = useState(true);
  const [secondsPerShot, setSecondsPerShot] = useState(2.5);
  const [shotKind, setShotKind] = useState<DirectorShotKind>("medium");
  const [filmLookId, setFilmLookId] = useState<FilmLookId>("golden-epic");
  const [actorActionKind, setActorActionKind] = useState<ActorActionKind>("walk");
  const [cinematicEventKind, setCinematicEventKind] = useState<CinematicEventKind>("explosion");
  const [beatPreset, setBeatPreset] = useState<CinematicBeatPreset>("hero-entrance");
  const [transitionKind, setTransitionKind] = useState<ShotTransitionKind>("whip-pan");
  const [environmentTransitionKind, setEnvironmentTransitionKind] = useState<EnvironmentTransitionKind>("day-to-night");
  const [soundDesignBeat, setSoundDesignBeat] = useState<SoundDesignBeat>("explosion");
  const [actorFormation, setActorFormation] = useState<ActorFormation>("line");
  const [minecraftActorAction, setMinecraftActorAction] = useState<MinecraftActorAction>("mine");
  const [dialogueScript, setDialogueScript] = useState("Steve: We need to move.\nAlex: I am right behind you.");
  const [targetX, setTargetX] = useState(5);
  const [targetZ, setTargetZ] = useState(-4);
  const report = useMemo(() => analyzeProductionSequence(project), [project]);
  const preflight = useMemo(() => inspectFilmProject(project), [project]);
  const selectedShot = project.production.shots.find((shot) => shot.id === project.production.activeShotId) ?? null;
  const selectedPrimary = characters.some((character) => character.id === primaryId)
    ? primaryId
    : characters[0]?.id ?? "";
  const selectedSecondary = characters.some((character) => character.id === secondaryId)
    ? secondaryId
    : characters.find((character) => character.id !== selectedPrimary)?.id ?? selectedPrimary;

  const applySelectedLook = () => {
    onProjectChange(applyFilmLook(project, filmLookId), "Apply cinematic film look");
  };

  const createCompleteFilm = () => {
    const result = createFilmStarter(project, {
      mode,
      lookId: filmLookId,
      primaryCharacterId: selectedPrimary,
      secondaryCharacterId: selectedSecondary,
      startFrame: project.animation.currentFrame,
      secondsPerShot,
      replaceGenerated,
      stageActors
    });
    onProjectChange(result.project, `Create complete ${mode} film starter`);
  };

  const generateSequence = () => {
    if (!selectedPrimary) return;
    if (mode === "dialogue") {
      const prepared = prepareDialogueSequence(project, {
        firstCharacterId: selectedPrimary,
        secondCharacterId: selectedSecondary,
        startFrame: project.animation.currentFrame,
        secondsPerShot,
        stageActors
      });
      const result = buildDirectorSequence(prepared.project, {
        ...prepared.blueprint,
        replaceExisting: replaceGenerated
      });
      onProjectChange(result.project, "Generate dialogue sequence");
      return;
    }
    const blueprint = mode === "action"
      ? createActionSequenceBlueprint(project, {
          heroId: selectedPrimary,
          opponentId: selectedSecondary,
          startFrame: project.animation.currentFrame,
          secondsPerShot
        })
      : createShowcaseSequenceBlueprint(project, {
          subjectId: selectedPrimary,
          startFrame: project.animation.currentFrame,
          secondsPerShot
        });
    const result = buildDirectorSequence(project, {
      ...blueprint,
      replaceExisting: replaceGenerated
    });
    onProjectChange(result.project, `Generate ${mode} sequence`);
  };

  const applySelectedActorAction = () => {
    if (!selectedPrimary) return;
    const actor = characters.find((character) => character.id === selectedPrimary);
    const result = applyActorAction(project, {
      kind: actorActionKind,
      actorId: selectedPrimary,
      targetActorId: selectedSecondary !== selectedPrimary ? selectedSecondary : undefined,
      targetPosition: [targetX, actor?.transform.position[1] ?? 1.05, targetZ],
      startFrame: project.animation.currentFrame,
      durationFrames: Math.max(4, Math.round(secondsPerShot * project.animation.fps)),
      intensity: 1
    });
    if (result.changed) onProjectChange(result.project, `Create ${actorActionKind} actor choreography`);
  };

  const addFightBeat = () => {
    if (!selectedPrimary || selectedPrimary === selectedSecondary) return;
    const result = createFightBeat(
      project,
      selectedPrimary,
      selectedSecondary,
      project.animation.currentFrame,
      Math.max(12, Math.round(secondsPerShot * project.animation.fps))
    );
    if (result.changed) onProjectChange(result.project, "Create fight choreography beat");
  };

  const addWalkAndTalk = () => {
    if (!selectedPrimary || selectedPrimary === selectedSecondary) return;
    const actor = characters.find((character) => character.id === selectedPrimary);
    const result = createWalkAndTalk(
      project,
      selectedPrimary,
      selectedSecondary,
      [targetX, actor?.transform.position[1] ?? 1.05, targetZ],
      project.animation.currentFrame,
      Math.max(24, Math.round(secondsPerShot * project.animation.fps * 2))
    );
    if (result.changed) onProjectChange(result.project, "Create walk and talk choreography");
  };

  const addCinematicEvent = () => {
    const actor = characters.find((character) => character.id === selectedPrimary);
    const result = applyCinematicEvent(project, {
      kind: cinematicEventKind,
      frame: project.animation.currentFrame,
      primaryActorId: selectedPrimary || undefined,
      secondaryActorId: selectedSecondary !== selectedPrimary ? selectedSecondary : undefined,
      position: actor ? [...actor.transform.position] : [targetX, 1.05, targetZ],
      destination: [targetX, actor?.transform.position[1] ?? 1.05, targetZ],
      intensity: 1
    });
    if (result.changed) onProjectChange(result.project, `Create ${cinematicEventKind} cinematic event`);
  };

  const createDialogueFromScript = () => {
    if (!selectedPrimary || !selectedSecondary || selectedPrimary === selectedSecondary) return;
    const result = createScriptedDialogueScene(project, {
      script: dialogueScript,
      primaryActorId: selectedPrimary,
      secondaryActorId: selectedSecondary,
      startFrame: project.animation.currentFrame,
      createCameras: true,
      createMutedAudioPlaceholders: true
    });
    if (result.changed) onProjectChange(result.project, "Create scripted dialogue scene");
  };

  const addCinematicBeat = () => {
    if (!selectedPrimary) return;
    const actor = characters.find((character) => character.id === selectedPrimary);
    const result = createCinematicBeat(project, {
      preset: beatPreset,
      primaryActorId: selectedPrimary,
      secondaryActorId: selectedSecondary !== selectedPrimary ? selectedSecondary : undefined,
      startFrame: project.animation.currentFrame,
      targetPosition: [targetX, actor?.transform.position[1] ?? 1.05, targetZ],
      applyRecommendedLook: true
    });
    if (result.changed) onProjectChange(result.project, `Create ${beatPreset} cinematic beat`);
  };

  const addSelectedTransition = () => {
    if (!selectedShot) return;
    const result = applyShotTransition(project, selectedShot.id, transitionKind, 1);
    if (result.changed) onProjectChange(result.project, `Apply ${transitionKind} transition`);
  };

  const addHandheld = () => {
    if (!selectedShot) return;
    applyShotEdit("Add handheld camera motion", addHandheldCameraMotion(project, selectedShot.id, 0.55, 14));
  };

  const smoothSelectedCamera = () => {
    if (!selectedShot) return;
    applyShotEdit("Smooth camera path", smoothCameraPath(project, selectedShot.id, 2));
  };

  const reverseSelectedCamera = () => {
    if (!selectedShot) return;
    applyShotEdit("Reverse camera move", reverseCameraMove(project, selectedShot.id));
  };

  const retimeSelectedShot = () => {
    if (!selectedShot) return;
    applyShotEdit("Retime shot and camera", retimeShotWithCamera(project, selectedShot.id, Math.max(2, Math.round(secondsPerShot * project.animation.fps))));
  };

  const repairFilm = () => {
    const result = autoRepairFilmProject(project);
    if (result.changed) onProjectChange(result.project, "Repair film project");
  };

  const downloadArtifact = (artifact: ProductionTextArtifact) => {
    downloadBrowserBlob(new Blob([artifact.content], { type: artifact.mimeType }), artifact.filename);
  };

  const addEnvironmentTransition = () => {
    const result = createEnvironmentTransition(
      project,
      environmentTransitionKind,
      project.animation.currentFrame,
      Math.max(12, Math.round(secondsPerShot * project.animation.fps * 2))
    );
    if (result.changed) onProjectChange(result.project, `Create ${environmentTransitionKind} environment transition`);
  };

  const addSoundDesignBeat = () => {
    const result = createSoundDesignBeat(project, soundDesignBeat, project.animation.currentFrame, 1);
    if (result.changed) onProjectChange(result.project, `Create ${soundDesignBeat} sound design beat`);
  };

  const arrangeActors = () => {
    if (characters.length === 0) return;
    const result = stageActorFormation(project, {
      formation: actorFormation,
      actorIds: characters.map((character) => character.id),
      center: [targetX, characters[0]?.transform.position[1] ?? 1.05, targetZ],
      faceTarget: [targetX, (characters[0]?.transform.position[1] ?? 1.05) + 0.5, targetZ - 10],
      spacing: 2.2,
      frame: project.animation.currentFrame,
      animateFrames: Math.max(0, Math.round(secondsPerShot * project.animation.fps))
    });
    if (result.changed) onProjectChange(result.project, `Arrange actors in ${actorFormation} formation`);
  };

  const addMinecraftActorAction = () => {
    if (!selectedPrimary) return;
    const actor = characters.find((character) => character.id === selectedPrimary);
    const result = applyMinecraftActorAction(project, {
      kind: minecraftActorAction,
      actorId: selectedPrimary,
      startFrame: project.animation.currentFrame,
      durationFrames: Math.max(8, Math.round(secondsPerShot * project.animation.fps)),
      targetPosition: [targetX, actor?.transform.position[1] ?? 1.05, targetZ],
      intensity: 1
    });
    if (result.changed) onProjectChange(result.project, `Create ${minecraftActorAction} Minecraft action`);
  };

  const applyShotEdit = (label: string, edit: { project: MineMotionProject; changed: boolean }) => {
    if (edit.changed) onProjectChange(edit.project, label);
  };

  const splitAtPlayhead = () => {
    if (!selectedShot) return;
    applyShotEdit("Split production shot", splitProductionShot(project, selectedShot.id, project.animation.currentFrame));
  };

  const duplicateCameraTake = () => {
    if (!selectedShot) return;
    applyShotEdit("Duplicate directed camera take", duplicateDirectedShotAsTake(project, selectedShot.id));
  };

  const closeGaps = () => applyShotEdit("Close shot sequence gaps", closeSequenceGaps(project));

  const rippleDelete = () => {
    if (!selectedShot) return;
    applyShotEdit("Ripple delete production shot", rippleDeleteShot(project, selectedShot.id));
  };

  const addSingleShot = () => {
    if (!selectedPrimary) return;
    const subjectIds = shotKind.startsWith("over-shoulder") || shotKind === "two-shot"
      ? [selectedPrimary, selectedSecondary]
      : [selectedPrimary];
    const result = buildDirectorSequence(project, {
      name: "Single directed shot",
      requests: [{
        kind: shotKind,
        subjectIds,
        startFrame: project.animation.currentFrame,
        durationFrames: Math.max(8, Math.round(secondsPerShot * project.animation.fps)),
        name: labelForKind(shotKind)
      }]
    });
    onProjectChange(result.project, `Create ${shotKind} shot`);
  };

  return (
    <section className="director-assistant-section">
      <div className="section-heading-row">
        <div>
          <h3><Film size={16} />{t("director.title")}</h3>
          <p>{t("director.description")}</p>
        </div>
        <span className="status-badge">
          {t("director.coverage", { value: Math.round(report.coverageRatio * 100) })}
        </span>
      </div>

      <div className="director-mode-grid" role="group" aria-label={t("director.mode")}>
        <button type="button" className={mode === "dialogue" ? "selected" : ""} onClick={() => setMode("dialogue")}>
          <MessageSquare size={15} />{t("director.mode.dialogue")}
        </button>
        <button type="button" className={mode === "action" ? "selected" : ""} onClick={() => setMode("action")}>
          <Swords size={15} />{t("director.mode.action")}
        </button>
        <button type="button" className={mode === "showcase" ? "selected" : ""} onClick={() => setMode("showcase")}>
          <Sparkles size={15} />{t("director.mode.showcase")}
        </button>
      </div>

      <div className="form-grid two-columns">
        <label>{t("director.primary")}
          <select value={selectedPrimary} onChange={(event) => setPrimaryId(event.target.value)}>
            {characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
          </select>
        </label>
        <label>{t("director.secondary")}
          <select value={selectedSecondary} onChange={(event) => setSecondaryId(event.target.value)}>
            {characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
          </select>
        </label>
        <label>{t("director.secondsPerShot")}
          <input type="number" min={0.5} max={20} step={0.25} value={secondsPerShot} onChange={(event) => setSecondsPerShot(Math.max(0.5, Number(event.target.value) || 0.5))} />
        </label>
        <label>{t("director.filmLook")}
          <select value={filmLookId} onChange={(event) => setFilmLookId(event.target.value as FilmLookId)}>
            {FILM_LOOKS.map((look) => <option key={look.id} value={look.id}>{look.name}</option>)}
          </select>
        </label>
        <label>{t("director.singleShot")}
          <select value={shotKind} onChange={(event) => setShotKind(event.target.value as DirectorShotKind)}>
            {DIRECTOR_SHOT_KINDS.map((kind) => <option key={kind} value={kind}>{labelForKind(kind)}</option>)}
          </select>
        </label>
      </div>

      <div className="production-options">
        <label className="checkbox-label"><input type="checkbox" checked={stageActors} onChange={(event) => setStageActors(event.target.checked)} />{t("director.stageActors")}</label>
        <label className="checkbox-label"><input type="checkbox" checked={replaceGenerated} onChange={(event) => setReplaceGenerated(event.target.checked)} />{t("director.replaceGenerated")}</label>
      </div>
      <div className="production-toolbar compact">
        <button type="button" disabled={!selectedPrimary || (mode === "dialogue" && selectedPrimary === selectedSecondary)} onClick={generateSequence}>
          <Film size={14} />{t("director.generateSequence")}
        </button>
        <button type="button" onClick={createCompleteFilm}>
          <Sparkles size={14} />{t("director.createCompleteFilm")}
        </button>
        <button type="button" onClick={applySelectedLook}>{t("director.applyLook")}</button>
        <button type="button" disabled={!selectedPrimary} onClick={addSingleShot}>
          <Camera size={14} />{t("director.addShot")}
        </button>
      </div>

      <div className="director-choreography">
        <h4>{t("director.choreography")}</h4>
        <div className="form-grid three-columns">
          <label>{t("director.actorAction")}
            <select value={actorActionKind} onChange={(event) => setActorActionKind(event.target.value as ActorActionKind)}>
              {ACTOR_ACTION_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
          </label>
          <label>{t("director.targetX")}<input type="number" step={0.25} value={targetX} onChange={(event) => setTargetX(Number(event.target.value) || 0)} /></label>
          <label>{t("director.targetZ")}<input type="number" step={0.25} value={targetZ} onChange={(event) => setTargetZ(Number(event.target.value) || 0)} /></label>
        </div>
        <div className="production-toolbar compact">
          <button type="button" disabled={!selectedPrimary} onClick={applySelectedActorAction}>{t("director.applyActorAction")}</button>
          <button type="button" disabled={!selectedPrimary || selectedPrimary === selectedSecondary} onClick={addFightBeat}>{t("director.fightBeat")}</button>
          <button type="button" disabled={!selectedPrimary || selectedPrimary === selectedSecondary} onClick={addWalkAndTalk}>{t("director.walkAndTalk")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <h4>{t("director.scriptedDialogue")}</h4>
        <label>{t("director.dialogueScript")}
          <textarea rows={5} value={dialogueScript} onChange={(event) => setDialogueScript(event.target.value)} placeholder={t("director.dialogueScriptPlaceholder")} />
        </label>
        <p className="director-event-hint">{t("director.dialogueScriptHint")}</p>
        <div className="production-toolbar compact">
          <button type="button" disabled={!selectedPrimary || selectedPrimary === selectedSecondary || dialogueScript.trim().length === 0} onClick={createDialogueFromScript}>{t("director.createScriptedDialogue")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <h4>{t("director.cinematicBeats")}</h4>
        <div className="form-grid two-columns">
          <label>{t("director.cinematicBeat")}
            <select value={beatPreset} onChange={(event) => setBeatPreset(event.target.value as CinematicBeatPreset)}>
              {CINEMATIC_BEAT_PRESETS.map((preset) => <option key={preset} value={preset}>{labelForBeat(preset)}</option>)}
            </select>
          </label>
          <div className="director-event-hint">{t("director.cinematicBeatHint")}</div>
        </div>
        <div className="production-toolbar compact">
          <button type="button" disabled={!selectedPrimary} onClick={addCinematicBeat}>{t("director.createCinematicBeat")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <h4>{t("director.cinematicEvents")}</h4>
        <div className="form-grid two-columns">
          <label>{t("director.cinematicEvent")}
            <select value={cinematicEventKind} onChange={(event) => setCinematicEventKind(event.target.value as CinematicEventKind)}>
              {CINEMATIC_EVENT_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
          </label>
          <div className="director-event-hint">{t("director.cinematicEventHint")}</div>
        </div>
        <div className="production-toolbar compact">
          <button type="button" onClick={addCinematicEvent}>{t("director.addCinematicEvent")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <h4>{t("director.cameraEditing")}</h4>
        <div className="form-grid two-columns">
          <label>{t("director.transition")}
            <select value={transitionKind} onChange={(event) => setTransitionKind(event.target.value as ShotTransitionKind)}>
              {SHOT_TRANSITION_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
          </label>
          <button type="button" disabled={!selectedShot} onClick={addSelectedTransition}>{t("director.applyTransition")}</button>
        </div>
        <div className="production-toolbar compact">
          <button type="button" disabled={!selectedShot} onClick={addHandheld}>{t("director.handheld")}</button>
          <button type="button" disabled={!selectedShot} onClick={smoothSelectedCamera}>{t("director.smoothCamera")}</button>
          <button type="button" disabled={!selectedShot} onClick={reverseSelectedCamera}>{t("director.reverseCamera")}</button>
          <button type="button" disabled={!selectedShot} onClick={retimeSelectedShot}>{t("director.retimeShot")}</button>
        </div>
      </div>

      <div className="production-toolbar compact">
        <button type="button" disabled={!selectedShot || project.animation.currentFrame <= (selectedShot?.startFrame ?? 0) || project.animation.currentFrame > (selectedShot?.endFrame ?? -1)} onClick={splitAtPlayhead}>{t("director.split")}</button>
        <button type="button" disabled={!selectedShot} onClick={duplicateCameraTake}>{t("director.duplicateTake")}</button>
        <button type="button" disabled={project.production.shots.length === 0} onClick={closeGaps}>{t("director.closeGaps")}</button>
        <button type="button" disabled={!selectedShot} onClick={rippleDelete}>{t("director.rippleDelete")}</button>
      </div>

      <div className="director-choreography">
        <h4>{t("director.minecraftActions")}</h4>
        <div className="form-grid two-columns">
          <label>{t("director.minecraftAction")}
            <select value={minecraftActorAction} onChange={(event) => setMinecraftActorAction(event.target.value as MinecraftActorAction)}>
              {MINECRAFT_ACTOR_ACTIONS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
          </label>
          <button type="button" disabled={!selectedPrimary} onClick={addMinecraftActorAction}>{t("director.createMinecraftAction")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <h4>{t("director.groupBlocking")}</h4>
        <div className="form-grid two-columns">
          <label>{t("director.actorFormation")}
            <select value={actorFormation} onChange={(event) => setActorFormation(event.target.value as ActorFormation)}>
              {ACTOR_FORMATIONS.map((formation) => <option key={formation} value={formation}>{formation}</option>)}
            </select>
          </label>
          <button type="button" disabled={characters.length === 0} onClick={arrangeActors}>{t("director.arrangeActors")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <h4>{t("director.soundDesign")}</h4>
        <div className="form-grid two-columns">
          <label>{t("director.soundDesignBeat")}
            <select value={soundDesignBeat} onChange={(event) => setSoundDesignBeat(event.target.value as SoundDesignBeat)}>
              {SOUND_DESIGN_BEATS.map((beat) => <option key={beat} value={beat}>{labelForSoundBeat(beat)}</option>)}
            </select>
          </label>
          <button type="button" onClick={addSoundDesignBeat}>{t("director.createSoundDesign")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <h4>{t("director.environmentDirection")}</h4>
        <div className="form-grid two-columns">
          <label>{t("director.environmentTransition")}
            <select value={environmentTransitionKind} onChange={(event) => setEnvironmentTransitionKind(event.target.value as EnvironmentTransitionKind)}>
              {ENVIRONMENT_TRANSITION_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
          </label>
          <button type="button" onClick={addEnvironmentTransition}>{t("director.createEnvironmentTransition")}</button>
        </div>
      </div>

      <div className="director-choreography">
        <div className="section-heading-row">
          <div>
            <h4>{t("director.preflight")}</h4>
            <p>{t("director.preflightScore", { value: preflight.score })}</p>
          </div>
          <button type="button" disabled={preflight.ready} onClick={repairFilm}>{t("director.repairFilm")}</button>
        </div>
        {preflight.issues.slice(0, 5).map((issue) => <p key={issue.id} className={`${issue.severity}-note`}>{issue.message}</p>)}
        {preflight.issues.length === 0 && <p className="success-note">{t("director.preflightReady")}</p>}
      </div>

      <div className="director-choreography">
        <h4>{t("director.productionDocuments")}</h4>
        <div className="production-toolbar compact">
          <button type="button" onClick={() => downloadArtifact(createShotListCsv(project))}>{t("director.exportShotList")}</button>
          <button type="button" onClick={() => downloadArtifact(createEditDecisionList(project))}>{t("director.exportEdl")}</button>
          <button type="button" onClick={() => downloadArtifact(createStoryboardMarkdown(project))}>{t("director.exportStoryboard")}</button>
          <button type="button" onClick={() => downloadArtifact(createDialogueRecordingScript(project))}>{t("director.exportDialogue")}</button>
          <button type="button" onClick={() => downloadArtifact(createProductionManifest(project))}>{t("director.exportManifest")}</button>
        </div>
      </div>

      <StudioProSection
        project={project}
        primaryId={selectedPrimary}
        secondaryId={selectedSecondary}
        onProjectChange={onProjectChange}
      />

      <MinecraftCreationSuiteSection
        project={project}
        onProjectChange={onProjectChange}
      />

      <div className="director-analysis">
        <strong>{t("director.analysis", { shots: report.activeShotCount, issues: report.issues.length })}</strong>
        {report.issues.slice(0, 4).map((entry) => (
          <p key={entry.id} className={`${entry.severity}-note`}>{entry.message}</p>
        ))}
      </div>
    </section>
  );
}
