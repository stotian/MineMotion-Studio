import { createCharacter } from "../../project/ProjectStore";
import type { MineMotionProject } from "../../project/ProjectFile";
import { createActionSequenceBlueprint } from "./ActionDirector";
import { buildDirectorSequence, type DirectorSequenceBuildResult } from "./DirectorSequenceBuilder";
import { prepareDialogueSequence } from "./DialogueDirector";
import { applyFilmLook, type FilmLookId } from "./FilmLook";
import { createShowcaseSequenceBlueprint } from "./ShowcaseDirector";

export type FilmStarterMode = "dialogue" | "action" | "showcase";

export interface FilmStarterOptions {
  mode: FilmStarterMode;
  lookId: FilmLookId;
  primaryCharacterId?: string;
  secondaryCharacterId?: string;
  startFrame?: number;
  secondsPerShot?: number;
  replaceGenerated?: boolean;
  stageActors?: boolean;
}

export interface FilmStarterResult extends DirectorSequenceBuildResult {
  createdCharacterIds: string[];
}

export function createFilmStarter(
  project: MineMotionProject,
  options: FilmStarterOptions
): FilmStarterResult {
  const requiredCharacters = options.mode === "showcase" ? 1 : 2;
  const cast = ensureCharacterCount(project, requiredCharacters);
  let preparedProject = applyFilmLook(cast.project, options.lookId);
  const primary = resolveCharacterId(preparedProject, options.primaryCharacterId, 0);
  const secondary = resolveCharacterId(preparedProject, options.secondaryCharacterId, 1);
  const startFrame = options.startFrame ?? preparedProject.animation.currentFrame;
  const secondsPerShot = options.secondsPerShot ?? 2.5;

  let result: DirectorSequenceBuildResult;
  if (options.mode === "dialogue") {
    const dialogue = prepareDialogueSequence(preparedProject, {
      firstCharacterId: primary,
      secondCharacterId: secondary,
      startFrame,
      secondsPerShot,
      stageActors: options.stageActors ?? true
    });
    preparedProject = dialogue.project;
    result = buildDirectorSequence(preparedProject, {
      ...dialogue.blueprint,
      replaceExisting: options.replaceGenerated
    });
  } else if (options.mode === "action") {
    result = buildDirectorSequence(preparedProject, {
      ...createActionSequenceBlueprint(preparedProject, {
        heroId: primary,
        opponentId: secondary,
        startFrame,
        secondsPerShot
      }),
      replaceExisting: options.replaceGenerated
    });
  } else {
    result = buildDirectorSequence(preparedProject, {
      ...createShowcaseSequenceBlueprint(preparedProject, {
        subjectId: primary,
        startFrame,
        secondsPerShot
      }),
      replaceExisting: options.replaceGenerated
    });
  }

  return {
    ...result,
    project: {
      ...result.project,
      projectName: result.project.projectName === "Untitled MineMotion Project"
        ? `${capitalize(options.mode)} Film`
        : result.project.projectName,
      projectSettings: {
        ...result.project.projectSettings,
        projectName: result.project.projectSettings.projectName === "Untitled MineMotion Project"
          ? `${capitalize(options.mode)} Film`
          : result.project.projectSettings.projectName
      }
    },
    createdCharacterIds: cast.createdCharacterIds
  };
}

export function ensureCharacterCount(
  project: MineMotionProject,
  minimum: number
): { project: MineMotionProject; createdCharacterIds: string[] } {
  const characters = [...project.scene.characters];
  const createdCharacterIds: string[] = [];
  while (characters.length < minimum) {
    const index = characters.length;
    const character = createCharacter(index === 0 ? "Steve Rig" : `Actor ${index + 1}`, [index * 2.8, 1.05, 0]);
    character.modelType = index % 2 === 0 ? "steve" : "alex";
    character.metadata = { ...character.metadata, generatedBy: "MineMotion Film Starter" };
    characters.push(character);
    createdCharacterIds.push(character.id);
  }
  return {
    project: characters.length === project.scene.characters.length
      ? project
      : { ...project, scene: { ...project.scene, characters } },
    createdCharacterIds
  };
}

function resolveCharacterId(project: MineMotionProject, requested: string | undefined, fallbackIndex: number): string {
  if (requested && project.scene.characters.some((character) => character.id === requested)) return requested;
  return project.scene.characters[fallbackIndex]?.id ?? project.scene.characters[0]?.id ?? "";
}

function capitalize(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}
