import { useCallback } from "react";
import type {
  TranslationKey,
  TranslationValues
} from "../../localization/LocalizationTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import type { CharacterExpressionOverlay } from "../RigTypes";
import { setProjectCharacterExpression } from "./ExpressionOverlayController";

type ProjectCommit = (
  updater: MineMotionProject | ((current: MineMotionProject) => MineMotionProject),
  label: string
) => boolean;

interface RigExpressionWorkspaceOptions {
  project: MineMotionProject;
  commitProject: ProjectCommit;
  setStatus: (status: string) => void;
  tr: (key: TranslationKey, values?: TranslationValues) => string;
}

export interface RigExpressionWorkspace {
  setExpression: (
    characterId: string,
    expression: CharacterExpressionOverlay | undefined
  ) => void;
}

export function useRigExpressionWorkspace({
  project,
  commitProject,
  setStatus,
  tr
}: RigExpressionWorkspaceOptions): RigExpressionWorkspace {
  const setExpression = useCallback((
    characterId: string,
    expression: CharacterExpressionOverlay | undefined
  ) => {
    const result = setProjectCharacterExpression(
      project,
      characterId,
      expression
    );
    if (!result.changed) {
      setStatus(
        result.error === "EXPRESSION_UNCHANGED"
          ? tr("app.expressionUnchanged")
          : result.error ?? tr("app.expressionUnavailable")
      );
      return;
    }
    commitProject(result.project, tr("history.updateExpression"));
    setStatus(
      expression
        ? tr("app.expressionUpdated")
        : tr("app.expressionDisabled")
    );
  }, [commitProject, project, setStatus, tr]);

  return { setExpression };
}
