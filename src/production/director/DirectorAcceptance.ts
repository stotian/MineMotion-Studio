import { runMinecraftCreationAcceptance } from "../../minecraft/studio/MinecraftCreationAcceptance";
import { createCharacter, createInitialProject } from "../../project/ProjectStore";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { createActionSequenceBlueprint } from "./ActionDirector";
import {
  ACTOR_ACTION_KINDS,
  applyActorAction,
  createFightBeat,
  createWalkAndTalk
} from "./ActorChoreography";
import { applyFilmLook, FILM_LOOKS } from "./FilmLook";
import { applyCinematicEvent, CINEMATIC_EVENT_KINDS } from "./CinematicEvents";
import { CINEMATIC_BEAT_PRESETS, createCinematicBeat } from "./CinematicBeatPresets";
import { addHandheldCameraMotion, retimeShotWithCamera, reverseCameraMove, smoothCameraPath } from "./CameraPathEditing";
import { applyShotTransition, SHOT_TRANSITION_KINDS } from "./ShotTransitions";
import { autoRepairFilmProject, inspectFilmProject } from "./FilmPreflight";
import { createDialogueRecordingScript, createEditDecisionList, createProductionManifest, createShotListCsv, createStoryboardMarkdown } from "./ProductionDocuments";
import { createEnvironmentTransition, ENVIRONMENT_TRANSITION_KINDS } from "./EnvironmentDirection";
import { createSoundDesignBeat, SOUND_DESIGN_BEATS } from "./SoundDesign";
import { ACTOR_FORMATIONS, stageActorFormation } from "./ActorBlocking";
import { applyMinecraftActorAction, MINECRAFT_ACTOR_ACTIONS } from "./MinecraftActorActions";
import { DIRECTOR_FEATURE_PHASES, DIRECTOR_FIRST_REAL_PHASE, DIRECTOR_LAST_REAL_PHASE } from "./DirectorFeatureRegistry";
import { createFilmStarter, ensureCharacterCount } from "./FilmStarter";
import { buildDirectorSequence, removeGeneratedDirectorContent } from "./DirectorSequenceBuilder";
import { prepareDialogueSequence, stageDialogueActors } from "./DialogueDirector";
import { createScriptedDialogueScene, parseDialogueScript } from "./DialoguePerformance";
import { analyzeProductionSequence } from "./SequenceAnalysis";
import { createShowcaseSequenceBlueprint } from "./ShowcaseDirector";
import { applyProductionCameraCut, resolveActiveProductionShot } from "./ShotRuntime";
import {
  closeSequenceGaps,
  duplicateDirectedShotAsTake,
  moveShotWithCameraAnimation,
  rippleDeleteShot,
  splitProductionShot
} from "./ShotEditing";
import { buildDirectorShot, DIRECTOR_SHOT_KINDS } from "./ShotRecipes";
import { synchronizeStoryboard } from "./StoryboardSync";
import { runStudioProAcceptance } from "./StudioProAcceptance";

const MINECRAFT_CREATION_FEATURE_COUNT = DIRECTOR_FEATURE_PHASES.filter((feature) => feature.id.startsWith("creation.")).length;

export interface DirectorAcceptanceResult {
  features: number;
  assertions: number;
  shotRecipes: number;
  generatedShots: number;
  animatedCameraTracks: number;
}

export function runDirectorAcceptance(): DirectorAcceptanceResult {
  let assertions = 0;
  const assert = (condition: unknown, message: string) => {
    assertions += 1;
    if (!condition) throw new Error(message);
  };
  const coveredAcceptanceIds = new Set<string>();
  const cover = (acceptanceId: string) => coveredAcceptanceIds.add(acceptanceId);

  assert(DIRECTOR_FEATURE_PHASES.length === 214 + MINECRAFT_CREATION_FEATURE_COUNT, "Director feature registry does not contain the expected real feature count.");
  assert(DIRECTOR_FIRST_REAL_PHASE === 601 && DIRECTOR_LAST_REAL_PHASE === 600 + DIRECTOR_FEATURE_PHASES.length, "Director real phases are not contiguous from 601 to the current feature count.");
  assert(new Set(DIRECTOR_FEATURE_PHASES.map((feature) => feature.id)).size === DIRECTOR_FEATURE_PHASES.length, "Director feature registry contains duplicate capability ids.");
  assert(new Set(DIRECTOR_FEATURE_PHASES.map((feature) => feature.acceptanceId)).size === DIRECTOR_FEATURE_PHASES.length, "Director feature registry contains duplicate acceptance ids.");
  assert(DIRECTOR_FEATURE_PHASES.every((feature, index) => feature.phase === 601 + index && feature.sourceOwner.endsWith(".ts")), "Director feature registry contains a gap or missing source owner.");

  let project = createInitialProject();
  const second = createCharacter("Alex Rig", [3, 1.05, 0]);
  const first = {
    ...project.scene.characters[0],
    metadata: { ...project.scene.characters[0].metadata, motionDirection: [0, 0, -1] }
  };
  project = {
    ...project,
    scene: {
      ...project.scene,
      characters: [first, second]
    }
  };

  const staged = stageDialogueActors(project, first.id, second.id);
  assert(staged.scene.characters[0].transform.position[0] < staged.scene.characters[1].transform.position[0], "Dialogue staging did not separate actors.");
  assert(staged.scene.characters.every((character) => character.metadata.directorStaged === true), "Dialogue staging metadata is missing.");

  const recipeCameras = new Set<string>();
  let movingRecipeCount = 0;
  for (const kind of DIRECTOR_SHOT_KINDS) {
    const result = buildDirectorShot(project, {
      kind,
      subjectIds: kind.startsWith("over-shoulder") || kind === "two-shot" ? [first.id, second.id] : [first.id],
      startFrame: 0,
      durationFrames: 48,
      name: `Acceptance ${kind}`
    });
    recipeCameras.add(result.camera.id);
    if (result.tracks.length > 0) movingRecipeCount += 1;
    assert(result.shot.cameraId === result.camera.id, `${kind} did not bind its shot to its generated camera.`);
    assert(Number.isFinite(result.camera.transform.rotation[0]), `${kind} generated an invalid camera rotation.`);
    cover(`director-shot-${kind}`);
  }
  assert(recipeCameras.size === DIRECTOR_SHOT_KINDS.length, "Shot recipes did not create independent cameras.");
  assert(movingRecipeCount >= 6, "Not enough shot recipes create real animated camera tracks.");

  for (const kind of ACTOR_ACTION_KINDS) {
    const action = applyActorAction(project, {
      kind,
      actorId: first.id,
      targetActorId: second.id,
      targetPosition: [5, 1.05, -4],
      startFrame: 12,
      durationFrames: 48,
      intensity: 1
    });
    assert(action.changed, `${kind} choreography did not change the project.`);
    assert(action.project.animation.tracks.some((track) => track.targetId === first.id && track.property.startsWith("bone.rotation.")), `${kind} choreography did not create rig animation.`);
    if (kind !== "idle") {
      assert(action.project.animation.tracks.some((track) => track.targetId === first.id && track.property === "transform.rotation"), `${kind} choreography did not orient the actor.`);
    }
    if (["walk", "run", "jump", "attack", "hit", "crouch"].includes(kind)) {
      assert(action.project.animation.tracks.some((track) => track.targetId === first.id && track.property === "transform.position"), `${kind} choreography did not animate actor movement.`);
    }
    cover(`director-actor-${kind}`);
  }
  let eventProject = project;
  for (const kind of CINEMATIC_EVENT_KINDS) {
    const beforeEffects = eventProject.effects.instances.length;
    const event = applyCinematicEvent(eventProject, {
      kind,
      frame: 36,
      primaryActorId: first.id,
      secondaryActorId: second.id,
      position: [0, 1.05, -1],
      destination: [6, 1.05, -8],
      intensity: 1
    });
    assert(event.changed, `${kind} cinematic event did not change the project.`);
    assert(event.error === null, `${kind} cinematic event returned an error.`);
    assert(event.effectIds.length > 0, `${kind} cinematic event created no effects.`);
    assert(event.project.effects.instances.length > beforeEffects, `${kind} cinematic event did not append effect instances.`);
    assert(event.effectIds.every((id) => event.project.effects.instances.some((effect) => effect.id === id)), `${kind} cinematic event returned missing effect ids.`);
    assert(event.project.animation.timelineTracks.some((lane) => lane.type === "effect" && event.effectIds.some((id) => lane.items.some((item) => item.effectId === id))), `${kind} cinematic event was not synchronized to the effect lane.`);
    cover(`director-event-${kind}`);
    eventProject = event.project;
  }
  const teleportTrack = eventProject.animation.tracks.find((track) => track.targetId === first.id && track.property === "transform.position" && track.keyframes.some((keyframe) => keyframe.frame === 38));
  assert(Boolean(teleportTrack), "Teleport event did not create a position cut track.");
  assert(eventProject.animation.tracks.some((track) => track.targetId === second.id && track.property.startsWith("bone.rotation.")), "Combat events did not animate the secondary actor.");

  for (const preset of CINEMATIC_BEAT_PRESETS) {
    const beat = createCinematicBeat(project, {
      preset,
      primaryActorId: first.id,
      secondaryActorId: second.id,
      startFrame: 24,
      targetPosition: [7, 1.05, -9],
      applyRecommendedLook: true
    });
    assert(beat.changed, `${preset} cinematic beat did not change the project.`);
    assert(beat.error === null, `${preset} cinematic beat returned an error.`);
    assert(beat.shotIds.length >= 3, `${preset} cinematic beat did not create a complete shot sequence.`);
    assert(beat.project.production.shots.filter((shot) => beat.shotIds.includes(shot.id)).length === beat.shotIds.length, `${preset} cinematic beat returned missing shot ids.`);
    assert(beat.project.animation.tracks.some((track) => track.targetId === first.id), `${preset} cinematic beat did not animate the primary actor.`);
    assert(beat.project.renderSettings.renderPreviewEnabled, `${preset} cinematic beat did not apply its recommended film look.`);
    cover(`director-beat-${preset}`);
  }

  const parsedScript = parseDialogueScript("Steve: We need to move now!\nAlex: The portal is already open.\nSteve: Then we go together.");
  assert(parsedScript.length === 3, "Dialogue parser did not preserve valid speaker lines.");
  assert(parsedScript[1].speaker === "Alex", "Dialogue parser lost the speaker name.");
  const scriptedDialogue = createScriptedDialogueScene(project, {
    script: "Steve: We need to move now!\nAlex: The portal is already open.\nSteve: Then we go together.",
    primaryActorId: first.id,
    secondaryActorId: second.id,
    startFrame: 12,
    wordsPerMinute: 150,
    pauseFrames: 6,
    createCameras: true
  });
  assert(scriptedDialogue.changed, "Scripted dialogue did not change the project.");
  assert(scriptedDialogue.clipIds.length === 3, "Scripted dialogue did not create one dialogue placeholder per line.");
  assert(scriptedDialogue.markerIds.length === 3, "Scripted dialogue did not create line markers.");
  assert(scriptedDialogue.lipSyncCueIds.length >= 9, "Scripted dialogue did not create useful text lip-sync cues.");
  assert(scriptedDialogue.shotIds.length >= 3, "Scripted dialogue did not create automatic dialogue cameras.");
  assert(scriptedDialogue.project.audio.clips.every((clip) => !scriptedDialogue.clipIds.includes(clip.id) || clip.role === "dialogue"), "Scripted dialogue created clips with the wrong audio role.");
  assert(scriptedDialogue.project.animation.timelineTracks.some((lane) => lane.type === "audio" && lane.items.length >= 3), "Scripted dialogue was not synchronized to the audio timeline.");
  assert(scriptedDialogue.project.animation.tracks.some((track) => track.targetId === first.id && track.property.startsWith("bone.rotation.")), "Scripted dialogue did not animate the primary speaker.");
  assert(scriptedDialogue.project.animation.tracks.some((track) => track.targetId === second.id && track.property.startsWith("bone.rotation.")), "Scripted dialogue did not animate the listener.");
  cover("director-dialogue-parse");
  cover("director-dialogue-timing");
  cover("director-dialogue-placeholders");
  cover("director-dialogue-lipsync");
  cover("director-dialogue-performance");
  cover("director-dialogue-cameras");

  const fightBeat = createFightBeat(project, first.id, second.id, 24, 36);
  assert(fightBeat.changed, "Fight beat did not create choreography.");
  assert(fightBeat.project.animation.tracks.some((track) => track.targetId === first.id && track.property === "transform.position"), "Fight beat did not animate the attacker.");
  assert(fightBeat.project.animation.tracks.some((track) => track.targetId === second.id && track.property === "transform.position"), "Fight beat did not animate defender knockback.");
  cover("director-actor-fight-beat");
  const walkTalk = createWalkAndTalk(project, first.id, second.id, [8, 1.05, -6], 0, 96);
  assert(walkTalk.changed, "Walk-and-talk did not create choreography.");
  assert(walkTalk.project.animation.tracks.filter((track) => track.property === "transform.position" && [first.id, second.id].includes(track.targetId)).length === 2, "Walk-and-talk did not move both actors.");
  cover("director-actor-walk-talk");

  for (const look of FILM_LOOKS) {
    const styled = applyFilmLook(project, look.id);
    assert(styled.lighting.presetId === look.lightingPresetId, `${look.id} did not apply its lighting preset.`);
    assert(styled.postProcessing.presetId === look.postPresetId, `${look.id} did not apply its post-processing preset.`);
    assert(styled.renderSettings.renderPreviewEnabled, `${look.id} did not enable final preview.`);
    cover(`director-look-${look.id}`);
  }

  const castless = { ...project, scene: { ...project.scene, characters: [] } };
  const cast = ensureCharacterCount(castless, 2);
  assert(cast.project.scene.characters.length === 2, "Film Starter did not create the required cast.");
  assert(cast.createdCharacterIds.length === 2, "Film Starter did not report generated actors.");
  cover("director-starter-cast");
  const starter = createFilmStarter(castless, {
    mode: "dialogue",
    lookId: "golden-epic",
    secondsPerShot: 1,
    stageActors: true
  });
  assert(starter.project.scene.characters.length === 2, "Complete Film Starter did not retain its generated cast.");
  assert(starter.project.production.shots.length === 6, "Complete Film Starter did not create a dialogue sequence.");
  assert(starter.project.postProcessing.presetId === "cinematic-warm", "Complete Film Starter did not apply its look.");
  assert(starter.project.renderSettings.cinematicBarsEnabled, "Complete Film Starter did not configure cinematic output.");
  cover("director-starter-complete");

  const preparedDialogue = prepareDialogueSequence(project, {
    firstCharacterId: first.id,
    secondCharacterId: second.id,
    startFrame: 0,
    secondsPerShot: 1,
    stageActors: true
  });
  const dialogue = buildDirectorSequence(preparedDialogue.project, preparedDialogue.blueprint);
  assert(dialogue.createdShotIds.length === 6, "Dialogue generator did not create six useful shots.");
  assert(dialogue.project.production.storyboard.length === 6, "Dialogue storyboard was not synchronized.");
  assert(dialogue.project.animation.timelineTracks.some((lane) => lane.type === "camera" && lane.items.length === 6), "Camera cut lane does not contain the dialogue shots.");
  cover("director-sequence-dialogue");
  cover("director-camera-cut-lane");

  const actionBlueprint = createActionSequenceBlueprint(project, {
    heroId: first.id,
    opponentId: second.id,
    startFrame: 0,
    secondsPerShot: 1
  });
  const action = buildDirectorSequence(project, actionBlueprint);
  assert(action.createdShotIds.length === 7, "Action generator did not create seven shots.");
  assert(action.project.animation.tracks.filter((track) => action.createdCameraIds.includes(track.targetId)).length >= 8, "Action generator did not create enough animated camera tracks.");
  const report = analyzeProductionSequence(action.project);
  assert(report.activeShotCount === 7, "Sequence analysis counted the wrong number of active shots.");
  assert(!report.issues.some((entry) => entry.severity === "warning" && entry.message.includes("overlaps")), "Action sequence contains unintended overlaps.");
  cover("director-sequence-action");
  cover("director-sequence-analysis");

  const firstActionShot = action.project.production.shots[0];
  const splitFrame = firstActionShot.startFrame + Math.floor((firstActionShot.endFrame - firstActionShot.startFrame + 1) / 2);
  const split = splitProductionShot(action.project, firstActionShot.id, splitFrame);
  assert(split.changed, "Shot split did not report a change.");
  assert(split.project.production.shots.length === action.project.production.shots.length + 1, "Shot split did not create a second editable shot.");
  const splitParts = split.project.production.shots.filter((shot) => shot.id === firstActionShot.id || shot.name === `${firstActionShot.name} B`);
  assert(splitParts[0].endFrame + 1 === splitParts[1].startFrame, "Shot split produced a gap or overlap.");
  cover("director-edit-split");

  const secondActionShot = action.project.production.shots[1];
  const activeShot = resolveActiveProductionShot(action.project, secondActionShot.startFrame);
  assert(activeShot?.id === secondActionShot.id, "Runtime shot resolution selected the wrong cut.");
  const cutProject = applyProductionCameraCut(action.project, secondActionShot.startFrame);
  assert(cutProject.activeCameraId === secondActionShot.cameraId, "Runtime camera cut did not switch cameras.");
  assert(cutProject.scene.cameras.find((camera) => camera.id === secondActionShot.cameraId)?.active === true, "Runtime camera cut did not update camera active flags.");
  cover("director-runtime-camera-cut");

  for (const transition of SHOT_TRANSITION_KINDS) {
    const transitioned = applyShotTransition(action.project, secondActionShot.id, transition, 1);
    assert(transitioned.changed, `${transition} did not create a shot transition.`);
    assert(transitioned.effectIds.length >= 2, `${transition} did not create a complete transition effect stack.`);
    assert(transitioned.effectIds.every((id) => transitioned.project.effects.instances.some((effect) => effect.id === id)), `${transition} transition returned missing effect ids.`);
    cover(`director-transition-${transition}`);
  }
  const handheld = addHandheldCameraMotion(action.project, secondActionShot.id, 0.6, 10);
  assert(handheld.changed, "Handheld camera motion did not change the project.");
  assert(handheld.affectedTrackIds.length === 2, "Handheld camera motion did not animate position and rotation.");
  const handheldRotation = handheld.project.animation.tracks.find((track) => track.id === `${secondActionShot.cameraId}:transform.rotation`);
  assert((handheldRotation?.keyframes.length ?? 0) >= 10, "Handheld camera motion did not create enough sampled keyframes.");
  const smoothed = smoothCameraPath(handheld.project, secondActionShot.id, 2);
  assert(smoothed.changed, "Camera smoothing did not change a sampled camera path.");
  assert(smoothed.affectedTrackIds.length >= 1, "Camera smoothing did not report affected tracks.");
  const reversed = reverseCameraMove(action.project, action.project.production.shots.find((shot) => action.project.animation.tracks.some((track) => track.targetId === shot.cameraId && track.keyframes.length >= 2))!.id);
  assert(reversed.changed, "Reverse camera move did not reverse an animated shot.");
  const retimed = retimeShotWithCamera(action.project, secondActionShot.id, (secondActionShot.endFrame - secondActionShot.startFrame + 1) + 20);
  assert(retimed.changed, "Camera retiming did not change the shot duration.");
  assert(retimed.project.production.shots.find((shot) => shot.id === secondActionShot.id)!.endFrame === secondActionShot.endFrame + 20, "Camera retiming produced the wrong shot duration.");
  cover("director-camera-handheld");
  cover("director-camera-smooth");
  cover("director-camera-reverse");
  cover("director-camera-retime");

  const duplicatedTake = duplicateDirectedShotAsTake(action.project, secondActionShot.id);
  assert(duplicatedTake.changed, "Camera take duplication did not report a change.");
  assert(duplicatedTake.project.scene.cameras.length === action.project.scene.cameras.length + 1, "Camera take duplication did not clone the camera.");
  assert(duplicatedTake.project.production.shots.filter((shot) => shot.takeGroupId === secondActionShot.takeGroupId && shot.activeTake).length === 1, "Camera take duplication left multiple active takes.");
  assert(duplicatedTake.project.animation.tracks.length > action.project.animation.tracks.length, "Camera take duplication did not clone camera animation.");
  cover("director-edit-duplicate-take");

  const movingShot = action.project.production.shots.find((shot) => action.project.animation.tracks.some((track) => track.targetId === shot.cameraId))!;
  const sourceKeyframe = action.project.animation.tracks.find((track) => track.targetId === movingShot.cameraId)!.keyframes[0].frame;
  const moved = moveShotWithCameraAnimation(action.project, movingShot.id, movingShot.startFrame + 20);
  const movedKeyframe = moved.project.animation.tracks.find((track) => track.targetId === movingShot.cameraId)!.keyframes[0].frame;
  assert(moved.changed && movedKeyframe === sourceKeyframe + 20, "Moving a shot did not move its generated camera animation.");
  cover("director-edit-move");

  const withGap = moveShotWithCameraAnimation(action.project, action.project.production.shots[3].id, action.project.production.shots[3].startFrame + 30).project;
  const closed = closeSequenceGaps(withGap);
  assert(closed.changed, "Close gaps did not report a change.");
  assert(!analyzeProductionSequence(closed.project).issues.some((entry) => entry.message.includes("uncovered gap")), "Close gaps left uncovered frames between active shots.");
  cover("director-edit-close-gaps");

  const deletedShot = action.project.production.shots[2];
  const deletedCameraId = deletedShot.cameraId;
  const rippled = rippleDeleteShot(action.project, deletedShot.id);
  assert(rippled.project.production.shots.length === action.project.production.shots.length - 1, "Ripple delete did not remove the selected shot.");
  assert(!rippled.project.scene.cameras.some((camera) => camera.id === deletedCameraId), "Ripple delete left an orphan generated camera.");
  cover("director-edit-ripple-delete");

  const showcase = buildDirectorSequence(project, createShowcaseSequenceBlueprint(project, {
    subjectId: first.id,
    startFrame: 12,
    secondsPerShot: 1
  }));
  assert(showcase.createdShotIds.length === 5, "Showcase generator did not create five shots.");
  assert(showcase.project.animation.durationFrames >= showcase.project.production.shots.at(-1)!.endFrame, "Sequence builder did not extend the timeline.");
  cover("director-sequence-showcase");

  const withFreeCard = {
    ...action.project,
    production: {
      ...action.project.production,
      storyboard: [...action.project.production.storyboard, {
        id: "free_card",
        shotId: null,
        title: "Free note",
        notes: "Keep this note",
        durationFrames: 1,
        cameraId: "",
        status: "planned" as const
      }]
    }
  };
  const synchronized = synchronizeStoryboard(withFreeCard);
  assert(synchronized.production.storyboard.some((card) => card.id === "free_card"), "Storyboard synchronization deleted a free planning card.");
  assert(synchronized.production.storyboard.filter((card) => card.shotId).length === 7, "Storyboard synchronization lost active shots.");
  cover("director-storyboard-sync");

  const roundTripped = JSON.parse(JSON.stringify(action.project)) as typeof action.project;
  assert(roundTripped.production.shots.length === action.project.production.shots.length, "Project serialization lost Director shots.");
  assert(roundTripped.scene.cameras.length === action.project.scene.cameras.length, "Project serialization lost Director cameras.");
  assert(roundTripped.animation.tracks.length === action.project.animation.tracks.length, "Project serialization lost Director camera animation.");
  const roundTripCut = applyProductionCameraCut(roundTripped, secondActionShot.startFrame);
  assert(roundTripCut.activeCameraId === secondActionShot.cameraId, "Reloaded Director sequence no longer evaluates camera cuts.");

  for (const kind of MINECRAFT_ACTOR_ACTIONS) {
    const minecraftAction = applyMinecraftActorAction(project, {
      kind,
      actorId: first.id,
      startFrame: 18,
      durationFrames: 48,
      targetPosition: [6, 1.05, -7],
      intensity: 1
    });
    assert(minecraftAction.changed, `${kind} Minecraft actor action did not change the project.`);
    assert(minecraftAction.error === null, `${kind} Minecraft actor action returned an error.`);
    assert(minecraftAction.trackIds.length >= 1, `${kind} Minecraft actor action did not create animation tracks.`);
    assert(minecraftAction.trackIds.every((id) => minecraftAction.project.animation.tracks.some((track) => track.id === id)), `${kind} Minecraft actor action returned missing track ids.`);
    assert(minecraftAction.project.animation.durationFrames >= 66, `${kind} Minecraft actor action did not extend the timeline.`);
    if (["sneak", "swim", "elytra-flight", "celebrate"].includes(kind)) {
      assert(minecraftAction.project.animation.tracks.some((track) => track.targetId === first.id && track.property === "transform.position"), `${kind} Minecraft actor action did not animate the actor transform.`);
    }
    cover(`director-minecraft-action-${kind}`);
  }

  const crowdActors = Array.from({ length: 8 }, (_, index) => createCharacter(`Crowd ${index + 1}`, [index, 1.05, 0]));
  const crowdProject = { ...project, scene: { ...project.scene, characters: crowdActors } };
  for (const formation of ACTOR_FORMATIONS) {
    const stagedCrowd = stageActorFormation(crowdProject, {
      formation,
      actorIds: crowdActors.map((actor) => actor.id),
      center: [0, 1.05, 0],
      faceTarget: [0, 1.8, -10],
      spacing: 2,
      frame: 24,
      animateFrames: 18
    });
    assert(stagedCrowd.changed, `${formation} actor formation did not change the project.`);
    assert(stagedCrowd.actorIds.length === 8, `${formation} actor formation did not stage every selected actor.`);
    const positionKeys = stagedCrowd.project.animation.tracks.filter((track) => crowdActors.some((actor) => actor.id === track.targetId) && track.property === "transform.position");
    assert(positionKeys.length === 8, `${formation} actor formation did not create movement tracks for every actor.`);
    const positions = stagedCrowd.project.scene.characters.map((actor) => actor.transform.position.join(","));
    assert(new Set(positions).size === 8, `${formation} actor formation stacked multiple actors at the same position.`);
    assert(stagedCrowd.project.scene.characters.every((actor) => actor.metadata.directorFormation === formation), `${formation} actor formation did not persist formation metadata.`);
    cover(`director-formation-${formation}`);
  }

  for (const beat of SOUND_DESIGN_BEATS) {
    const sound = createSoundDesignBeat(project, beat, 42, 1);
    assert(sound.changed, `${beat} sound-design beat did not change the project.`);
    assert(sound.clipIds.length === 3, `${beat} sound-design beat did not create three useful layers.`);
    assert(sound.clipIds.every((id) => sound.project.audio.clips.some((clip) => clip.id === id && clip.role === "sfx")), `${beat} sound-design beat returned invalid clips.`);
    assert(sound.project.audio.markers.some((marker) => marker.id === sound.markerId), `${beat} sound-design beat did not create a sync marker.`);
    assert(sound.project.animation.timelineTracks.some((lane) => lane.type === "audio" && lane.items.length === 3), `${beat} sound-design beat was not synchronized to the audio lane.`);
    cover(`director-sound-${beat}`);
  }

  for (const kind of ENVIRONMENT_TRANSITION_KINDS) {
    const transition = createEnvironmentTransition(project, kind, 20, 96);
    assert(transition.changed, `${kind} environment transition did not change the project.`);
    assert(transition.keyframeIds.length === 3, `${kind} environment transition did not create a three-stage transition.`);
    assert(transition.keyframeIds.every((id) => transition.project.lighting.keyframes.some((keyframe) => keyframe.id === id)), `${kind} environment transition returned missing keyframe ids.`);
    assert(transition.project.animation.timelineTracks.some((lane) => lane.type === "sky" && lane.items.length >= 3), `${kind} environment transition was not synchronized to the Lighting & Sky lane.`);
    assert(transition.project.animation.durationFrames >= 116, `${kind} environment transition did not extend the timeline.`);
    cover(`director-environment-${kind}`);
  }

  const shotList = createShotListCsv(action.project);
  assert(shotList.filename.endsWith(".csv"), "Shot-list export uses the wrong file type.");
  assert(shotList.content.split("\n").length === action.project.production.shots.length + 1, "Shot-list export omitted active shots.");
  assert(shotList.content.includes("camera"), "Shot-list export omitted camera information.");
  const edl = createEditDecisionList(action.project);
  assert(edl.filename.endsWith(".edl"), "EDL export uses the wrong file type.");
  assert(edl.content.includes("FCM: NON-DROP FRAME"), "EDL export omitted its timecode mode.");
  assert(edl.content.includes("FROM CLIP NAME"), "EDL export omitted clip records.");
  const storyboardDocument = createStoryboardMarkdown(action.project);
  assert(storyboardDocument.content.includes("Storyboard"), "Storyboard document omitted its title.");
  assert(action.project.production.shots.every((shot) => storyboardDocument.content.includes(shot.name)), "Storyboard document omitted one or more active shots.");
  const dialogueDocument = createDialogueRecordingScript(scriptedDialogue.project);
  assert(dialogueDocument.content.includes("Dialogue recording script"), "Dialogue recording export omitted its title.");
  assert(scriptedDialogue.project.audio.clips.filter((clip) => clip.role === "dialogue").every((clip) => dialogueDocument.content.includes(clip.name)), "Dialogue recording export omitted scheduled lines.");
  const manifest = createProductionManifest(scriptedDialogue.project);
  const manifestData = JSON.parse(manifest.content) as { schema: string; shots: unknown[]; dialogueClips: unknown[] };
  assert(manifestData.schema === "minemotion.production-manifest/1", "Production manifest uses the wrong schema.");
  assert(manifestData.shots.length === scriptedDialogue.project.production.shots.length, "Production manifest omitted shots.");
  assert(manifestData.dialogueClips.length === scriptedDialogue.clipIds.length, "Production manifest omitted dialogue clips.");
  cover("director-document-shot-list");
  cover("director-document-edl");
  cover("director-document-storyboard");
  cover("director-document-dialogue");
  cover("director-document-manifest");

  const brokenProject = {
    ...project,
    activeCameraId: "missing-camera",
    scene: { ...project.scene, characters: [], cameras: project.scene.cameras.map((camera) => ({ ...camera, active: false })) },
    production: { ...project.production, shots: [], storyboard: [] },
    renderSettings: { ...project.renderSettings, resolutionPreset: "720p" as const, renderPreviewEnabled: false, cinematicBarsEnabled: false },
    animation: { ...project.animation, timelineTracks: project.animation.timelineTracks.map((lane) => ({ ...lane, items: [] })) }
  };
  const preflight = inspectFilmProject(brokenProject);
  assert(!preflight.ready, "Film preflight incorrectly marked a broken project ready.");
  assert(preflight.issues.some((issue) => issue.id === "cast-empty"), "Film preflight did not report the missing cast.");
  assert(preflight.issues.some((issue) => issue.id === "shots-empty"), "Film preflight did not report missing shots.");
  assert(preflight.issues.some((issue) => issue.id === "active-camera-invalid"), "Film preflight did not report an invalid active camera.");
  const repaired = autoRepairFilmProject(brokenProject);
  assert(repaired.changed, "One-click film repair did not change the broken project.");
  assert(repaired.project.scene.characters.length >= 1, "One-click film repair did not restore a cast.");
  assert(repaired.project.production.shots.length >= 5, "One-click film repair did not create a usable shot sequence.");
  assert(repaired.project.scene.cameras.some((camera) => camera.id === repaired.project.activeCameraId), "One-click film repair did not restore an active camera.");
  assert(repaired.project.renderSettings.renderPreviewEnabled, "One-click film repair did not enable final preview.");
  assert(repaired.project.animation.timelineTracks.some((lane) => lane.type === "camera" && lane.items.length >= 5), "One-click film repair did not rebuild camera cuts.");
  cover("director-preflight-inspect");
  cover("director-preflight-repair");

  const studioPro = runStudioProAcceptance({ assert, cover });
  assert(studioPro.studioFeatures === 99, "Studio Pro acceptance did not execute every new functional feature.");

  const creationSuite = runMinecraftCreationAcceptance({ assert, cover });
  assert(creationSuite.creationFeatures === MINECRAFT_CREATION_FEATURE_COUNT, "Minecraft Creation Suite acceptance did not execute every functional feature.");

  const cleaned = removeGeneratedDirectorContent(syncCinematicTimeline(action.project));
  assert(cleaned.scene.cameras.length === project.scene.cameras.length, "Director cleanup did not preserve the original cameras.");
  assert(cleaned.production.shots.length === 0, "Director cleanup left generated shots behind.");
  assert(cleaned.animation.tracks.every((track) => !action.createdCameraIds.includes(track.targetId)), "Director cleanup left generated animation tracks behind.");

  const uncovered = DIRECTOR_FEATURE_PHASES.filter((feature) => !coveredAcceptanceIds.has(feature.acceptanceId));
  assert(uncovered.length === 0, `Director feature phases missing executed acceptance coverage: ${uncovered.map((feature) => `${feature.phase}:${feature.id}`).join(", ")}`);

  return {
    features: DIRECTOR_FEATURE_PHASES.length,
    assertions,
    shotRecipes: DIRECTOR_SHOT_KINDS.length,
    generatedShots: dialogue.createdShotIds.length + action.createdShotIds.length + showcase.createdShotIds.length,
    animatedCameraTracks: action.project.animation.tracks.filter((track) => action.createdCameraIds.includes(track.targetId)).length
  };
}
