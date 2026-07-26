import { useCallback, useMemo } from "react";
import type {
  TranslationKey,
  TranslationValues
} from "../../localization/LocalizationTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import type { CharacterAttachmentPointId } from "../RigTypes";
import {
  addProjectObjAttachment,
  removeProjectAttachment,
  updateProjectAttachment,
  validateProjectAttachments,
  type AttachmentCommandResult,
  type AttachmentPatch,
  type AttachmentValidationIssue
} from "./AttachmentController";

type ProjectCommit = (
  updater: MineMotionProject | ((current: MineMotionProject) => MineMotionProject),
  label: string
) => boolean;

interface RigAttachmentWorkspaceOptions {
  project: MineMotionProject;
  commitProject: ProjectCommit;
  setStatus: (status: string) => void;
  tr: (key: TranslationKey, values?: TranslationValues) => string;
}

export interface RigAttachmentWorkspace {
  issues: readonly AttachmentValidationIssue[];
  updateAttachment: (
    characterId: string,
    attachmentId: string,
    patch: AttachmentPatch
  ) => void;
  addObjAttachment: (
    characterId: string,
    assetId: string,
    pointId: CharacterAttachmentPointId
  ) => void;
  removeAttachment: (characterId: string, attachmentId: string) => void;
}

export function useRigAttachmentWorkspace({
  project,
  commitProject,
  setStatus,
  tr
}: RigAttachmentWorkspaceOptions): RigAttachmentWorkspace {
  const issues = useMemo(
    () => validateProjectAttachments(project),
    [project]
  );

  const commitResult = useCallback((
    result: AttachmentCommandResult,
    label: TranslationKey,
    success: TranslationKey
  ) => {
    if (!result.changed) {
      setStatus(attachmentError(result.error, tr));
      return;
    }
    commitProject(result.project, tr(label));
    setStatus(tr(success));
  }, [commitProject, setStatus, tr]);

  const updateAttachment = useCallback((
    characterId: string,
    attachmentId: string,
    patch: AttachmentPatch
  ) => {
    commitResult(
      updateProjectAttachment(project, characterId, attachmentId, patch),
      "history.updateAttachment",
      "app.attachmentUpdated"
    );
  }, [commitResult, project]);

  const addObjAttachment = useCallback((
    characterId: string,
    assetId: string,
    pointId: CharacterAttachmentPointId
  ) => {
    commitResult(
      addProjectObjAttachment(project, characterId, assetId, pointId),
      "history.addAttachment",
      "app.attachmentAdded"
    );
  }, [commitResult, project]);

  const removeAttachment = useCallback((
    characterId: string,
    attachmentId: string
  ) => {
    commitResult(
      removeProjectAttachment(project, characterId, attachmentId),
      "history.removeAttachment",
      "app.attachmentRemoved"
    );
  }, [commitResult, project]);

  return {
    issues,
    updateAttachment,
    addObjAttachment,
    removeAttachment
  };
}

function attachmentError(
  error: string | null,
  tr: RigAttachmentWorkspaceOptions["tr"]
): string {
  if (error === "ATTACHMENT_CHARACTER_LOCKED") {
    return tr("app.attachmentLocked");
  }
  if (error === "ATTACHMENT_ASSET_MISSING") {
    return tr("app.attachmentAssetMissing");
  }
  if (error === "ATTACHMENT_LIMIT_REACHED") {
    return tr("app.attachmentLimit");
  }
  if (error === "ATTACHMENT_POINT_INVALID") {
    return tr("app.attachmentPointInvalid");
  }
  return tr("app.attachmentUnchanged");
}
