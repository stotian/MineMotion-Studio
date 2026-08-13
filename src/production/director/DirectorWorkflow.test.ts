import { describe, expect, it } from "vitest";
import { createCharacter, createInitialProject } from "../../project/ProjectStore";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createActionSequenceBlueprint } from "./ActionDirector";
import { buildDirectorSequence } from "./DirectorSequenceBuilder";
import { prepareDialogueSequence } from "./DialogueDirector";
import { analyzeProductionSequence } from "./SequenceAnalysis";
import {
  closeSequenceGaps,
  duplicateDirectedShotAsTake,
  moveShotWithCameraAnimation,
  rippleDeleteShot,
  splitProductionShot
} from "./ShotEditing";
import { applyProductionCameraCut } from "./ShotRuntime";
import { buildDirectorShot, DIRECTOR_SHOT_KINDS } from "./ShotRecipes";

function createTwoActorProject() {
  const project = createInitialProject();
  return {
    ...project,
    scene: {
      ...project.scene,
      characters: [project.scene.characters[0], createCharacter("Alex", [3, 1.05, 0])]
    }
  };
}

describe("Minecraft Director workflow", () => {
  it.each(DIRECTOR_SHOT_KINDS)("builds a real %s camera shot", (kind) => {
    const project = createTwoActorProject();
    const subjects = kind.startsWith("over-shoulder") || kind === "two-shot"
      ? project.scene.characters.map((character) => character.id)
      : [project.scene.characters[0].id];
    const result = buildDirectorShot(project, {
      kind,
      subjectIds: subjects,
      startFrame: 0,
      durationFrames: 48
    });
    expect(result.shot.cameraId).toBe(result.camera.id);
    expect(result.camera.metadata.directorShotKind).toBe(kind);
  });

  it("builds and serializes a six-shot dialogue sequence", () => {
    const project = createTwoActorProject();
    const prepared = prepareDialogueSequence(project, {
      firstCharacterId: project.scene.characters[0].id,
      secondCharacterId: project.scene.characters[1].id,
      secondsPerShot: 1,
      stageActors: true
    });
    const result = buildDirectorSequence(prepared.project, prepared.blueprint);
    const reloaded = ProjectSerializer.parse(ProjectSerializer.serialize(result.project));
    expect(reloaded.production.shots).toHaveLength(6);
    expect(reloaded.production.storyboard).toHaveLength(6);
    expect(reloaded.animation.timelineTracks.find((lane) => lane.type === "camera")?.items).toHaveLength(6);
  });

  it("creates contiguous action cuts and switches the runtime camera", () => {
    const project = createTwoActorProject();
    const result = buildDirectorSequence(project, createActionSequenceBlueprint(project, {
      heroId: project.scene.characters[0].id,
      opponentId: project.scene.characters[1].id,
      secondsPerShot: 1
    }));
    const report = analyzeProductionSequence(result.project);
    expect(report.issues.some((issue) => issue.message.includes("overlaps"))).toBe(false);
    const shot = result.project.production.shots[2];
    expect(applyProductionCameraCut(result.project, shot.startFrame).activeCameraId).toBe(shot.cameraId);
  });

  it("edits shots without detaching generated camera animation", () => {
    const project = createTwoActorProject();
    const result = buildDirectorSequence(project, createActionSequenceBlueprint(project, {
      heroId: project.scene.characters[0].id,
      opponentId: project.scene.characters[1].id,
      secondsPerShot: 1
    }));
    const moving = result.project.production.shots[1];
    const moved = moveShotWithCameraAnimation(result.project, moving.id, moving.startFrame + 12);
    expect(moved.changed).toBe(true);
    const split = splitProductionShot(result.project, result.project.production.shots[0].id, 12);
    expect(split.project.production.shots).toHaveLength(8);
    const take = duplicateDirectedShotAsTake(result.project, moving.id);
    expect(take.project.scene.cameras).toHaveLength(result.project.scene.cameras.length + 1);
    const closed = closeSequenceGaps(moved.project);
    expect(analyzeProductionSequence(closed.project).issues.some((issue) => issue.message.includes("uncovered gap"))).toBe(false);
    const deleted = rippleDeleteShot(result.project, moving.id);
    expect(deleted.project.production.shots).toHaveLength(6);
  });
});

import { DIRECTOR_FEATURE_PHASES } from "./DirectorFeatureRegistry";
import { runDirectorAcceptance } from "./DirectorAcceptance";

describe("Director real feature registry", () => {
  it("keeps phases 601-1014 contiguous, unique and fully executable", () => {
    expect(DIRECTOR_FEATURE_PHASES).toHaveLength(414);
    expect(DIRECTOR_FEATURE_PHASES[0].phase).toBe(601);
    expect(DIRECTOR_FEATURE_PHASES.at(-1)?.phase).toBe(1014);
    expect(new Set(DIRECTOR_FEATURE_PHASES.map((feature) => feature.id)).size).toBe(414);
    expect(new Set(DIRECTOR_FEATURE_PHASES.map((feature) => feature.acceptanceId)).size).toBe(414);
    expect(runDirectorAcceptance().features).toBe(414);
  });
});
