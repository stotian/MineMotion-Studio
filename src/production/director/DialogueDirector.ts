import type { CharacterEntity, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { lookAtRotation, midpoint } from "./CameraMath";
import type { DirectorSequenceBlueprint } from "./DirectorSequenceBuilder";

export interface DialogueSequenceOptions {
  firstCharacterId: string;
  secondCharacterId: string;
  startFrame?: number;
  secondsPerShot?: number;
  stageActors?: boolean;
}

export interface DialogueSequencePreparation {
  project: MineMotionProject;
  blueprint: DirectorSequenceBlueprint;
  warnings: string[];
}

export function prepareDialogueSequence(
  project: MineMotionProject,
  options: DialogueSequenceOptions
): DialogueSequencePreparation {
  const first = project.scene.characters.find((character) => character.id === options.firstCharacterId);
  const second = project.scene.characters.find((character) => character.id === options.secondCharacterId);
  const warnings: string[] = [];
  if (!first || !second || first.id === second.id) {
    warnings.push("Dialogue direction requires two different characters.");
  }
  const stagedProject = options.stageActors && first && second
    ? stageDialogueActors(project, first.id, second.id)
    : project;
  const startFrame = Math.max(0, Math.round(options.startFrame ?? project.animation.currentFrame));
  const duration = Math.max(12, Math.round((options.secondsPerShot ?? 2.5) * project.animation.fps));
  const firstId = first?.id ?? options.firstCharacterId;
  const secondId = second?.id ?? options.secondCharacterId;
  const subjectIds = [firstId, secondId];
  const requests: DirectorSequenceBlueprint["requests"] = [
    { kind: "establishing", subjectIds, startFrame, durationFrames: duration, name: "Dialogue Establishing" },
    { kind: "over-shoulder-left", subjectIds, startFrame: startFrame + duration, durationFrames: duration, name: first ? `${first.name} OTS` : "Speaker A OTS" },
    { kind: "over-shoulder-right", subjectIds, startFrame: startFrame + duration * 2, durationFrames: duration, name: second ? `${second.name} OTS` : "Speaker B OTS" },
    { kind: "close-up", subjectIds: [firstId], startFrame: startFrame + duration * 3, durationFrames: duration, name: first ? `${first.name} Close-up` : "Speaker A Close-up", yawDegrees: -25 },
    { kind: "close-up", subjectIds: [secondId], startFrame: startFrame + duration * 4, durationFrames: duration, name: second ? `${second.name} Close-up` : "Speaker B Close-up", yawDegrees: 25 },
    { kind: "two-shot", subjectIds, startFrame: startFrame + duration * 5, durationFrames: duration, name: "Dialogue Two-shot", yawDegrees: 0 }
  ];
  return {
    project: stagedProject,
    blueprint: { name: "Dialogue sequence", requests },
    warnings
  };
}

export function stageDialogueActors(
  project: MineMotionProject,
  firstCharacterId: string,
  secondCharacterId: string,
  center?: Vector3Tuple
): MineMotionProject {
  const first = project.scene.characters.find((character) => character.id === firstCharacterId);
  const second = project.scene.characters.find((character) => character.id === secondCharacterId);
  if (!first || !second || first.id === second.id) return project;
  const stageCenter = center ?? midpoint(first.transform.position, second.transform.position);
  const firstPosition: Vector3Tuple = [stageCenter[0] - 1.4, stageCenter[1], stageCenter[2]];
  const secondPosition: Vector3Tuple = [stageCenter[0] + 1.4, stageCenter[1], stageCenter[2]];
  return {
    ...project,
    scene: {
      ...project.scene,
      characters: project.scene.characters.map((character) => {
        if (character.id === first.id) return faceCharacter(character, firstPosition, secondPosition);
        if (character.id === second.id) return faceCharacter(character, secondPosition, firstPosition);
        return character;
      })
    }
  };
}

function faceCharacter(
  character: CharacterEntity,
  position: Vector3Tuple,
  target: Vector3Tuple
): CharacterEntity {
  const look = lookAtRotation(position, target);
  return {
    ...character,
    transform: {
      ...character.transform,
      position,
      rotation: [0, look[1], 0]
    },
    metadata: {
      ...character.metadata,
      directorStaged: true
    }
  };
}
