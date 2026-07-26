import { useCallback } from "react";
import type {
  TranslationKey,
  TranslationValues
} from "../../localization/LocalizationTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import type { RigPresetId } from "../RigTypes";
import {
  bakeBlockbenchAnimation,
  setBlockbenchBoneMapping
} from "./BlockbenchMappingController";

type ProjectCommit = (
  updater: MineMotionProject | ((current: MineMotionProject) => MineMotionProject),
  label: string
) => boolean;

interface BlockbenchMappingWorkspaceOptions {
  project: MineMotionProject;
  commitProject: ProjectCommit;
  setStatus: (status: string) => void;
  tr: (key: TranslationKey, values?: TranslationValues) => string;
}

export interface BlockbenchMappingWorkspace {
  setMapping: (
    assetId: string,
    rigPresetId: RigPresetId,
    sourceGroupId: string,
    targetBoneId: string | null | undefined
  ) => void;
  applyAnimation: (
    assetId: string,
    characterId: string,
    animationId: string
  ) => void;
}

export function useBlockbenchMappingWorkspace({
  project,
  commitProject,
  setStatus,
  tr
}: BlockbenchMappingWorkspaceOptions): BlockbenchMappingWorkspace {
  const setMapping = useCallback((
    assetId: string,
    rigPresetId: RigPresetId,
    sourceGroupId: string,
    targetBoneId: string | null | undefined
  ) => {
    const result = setBlockbenchBoneMapping(
      project,
      assetId,
      rigPresetId,
      sourceGroupId,
      targetBoneId
    );
    if (!result.changed || !result.historyLabel) {
      setStatus(
        result.error === "BLOCKBENCH_MAPPING_UNCHANGED"
          ? tr("app.blockbenchMappingUnchanged")
          : result.error ?? tr("app.blockbenchMappingUnavailable")
      );
      return;
    }
    commitProject(result.project, tr("history.mapBlockbenchBone"));
    setStatus(
      targetBoneId === undefined
        ? tr("app.blockbenchMappingAutomatic")
        : tr("app.blockbenchMappingUpdated")
    );
  }, [commitProject, project, setStatus, tr]);

  const applyAnimation = useCallback((
    assetId: string,
    characterId: string,
    animationId: string
  ) => {
    const result = bakeBlockbenchAnimation(
      project,
      assetId,
      characterId,
      animationId
    );
    if (!result.changed || !result.historyLabel) {
      setStatus(result.error ?? tr("app.blockbenchAnimationUnavailable"));
      return;
    }
    commitProject(result.project, tr("history.applyBlockbenchAnimation"));
    setStatus(tr("app.blockbenchAnimationApplied", {
      warnings: result.warnings.length
    }));
  }, [commitProject, project, setStatus, tr]);

  return { setMapping, applyAnimation };
}
