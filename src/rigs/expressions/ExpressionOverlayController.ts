import type {
  CharacterEntity,
  MineMotionProject
} from "../../project/ProjectFile";
import type { CharacterExpressionOverlay } from "../RigTypes";
import { sanitizeCharacterExpression } from "./ExpressionOverlay";

export interface ExpressionOverlayCommandResult {
  project: MineMotionProject;
  changed: boolean;
  historyLabel: string | null;
  error: string | null;
}

export function setProjectCharacterExpression(
  project: MineMotionProject,
  characterId: string,
  value: CharacterExpressionOverlay | undefined
): ExpressionOverlayCommandResult {
  const character = project.scene.characters.find(
    (entry) => entry.id === characterId
  );
  if (!character) {
    return failure(project, "EXPRESSION_TARGET_MISSING");
  }
  if (character.locked) {
    return failure(project, "EXPRESSION_TARGET_LOCKED");
  }
  const expression = sanitizeCharacterExpression(value);
  if (sameExpression(character.expression, expression)) {
    return failure(project, "EXPRESSION_UNCHANGED");
  }
  const characters = project.scene.characters.map((entry) =>
    entry.id === characterId
      ? withExpression(entry, expression)
      : entry
  );
  return {
    project: {
      ...project,
      scene: {
        ...project.scene,
        characters
      }
    },
    changed: true,
    historyLabel: "Update character expression",
    error: null
  };
}

function withExpression(
  character: CharacterEntity,
  expression: CharacterExpressionOverlay | undefined
): CharacterEntity {
  if (expression) return { ...character, expression };
  const { expression: _removed, ...rest } = character;
  return rest;
}

function sameExpression(
  left: CharacterExpressionOverlay | undefined,
  right: CharacterExpressionOverlay | undefined
): boolean {
  return left?.preset === right?.preset &&
    left?.intensity === right?.intensity &&
    Boolean(left) === Boolean(right);
}

function failure(
  project: MineMotionProject,
  error: string
): ExpressionOverlayCommandResult {
  return {
    project,
    changed: false,
    historyLabel: null,
    error
  };
}
