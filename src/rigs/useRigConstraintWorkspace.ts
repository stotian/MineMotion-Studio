import { useMemo } from "react";
import type { MineMotionProject } from "../project/ProjectFile";
import {
  previewProjectLookAt,
  type LookAtPreviewResult
} from "./constraints/LookAtController";
import {
  useLookAtSession,
  type LookAtSession
} from "./constraints/useLookAtSession";
import {
  previewRigIKControls,
  type RigIKPreviewResult
} from "./IK/RigIKController";
import {
  useRigIKSession,
  type RigIKSession
} from "./IK/useRigIKSession";

export interface RigConstraintWorkspace {
  ikSession: RigIKSession;
  ikPreview: RigIKPreviewResult;
  lookAtSession: LookAtSession;
  lookAtPreview: LookAtPreviewResult;
  displayProject: MineMotionProject;
}

export function useRigConstraintWorkspace(
  project: MineMotionProject,
  selectedObjectId: string | null,
  animatedProject: MineMotionProject
): RigConstraintWorkspace {
  const ikSession = useRigIKSession(project, selectedObjectId);
  const lookAtSession = useLookAtSession(project, selectedObjectId);
  const ikPreview = useMemo(
    () => previewRigIKControls(
      animatedProject,
      ikSession.characterId,
      ikSession.controls
    ),
    [animatedProject, ikSession.characterId, ikSession.controls]
  );
  const lookAtPreview = useMemo(
    () => lookAtSession.control
      ? previewProjectLookAt(ikPreview.project, lookAtSession.control)
      : { project: ikPreview.project, solve: null, warnings: [] },
    [ikPreview.project, lookAtSession.control]
  );
  return {
    ikSession,
    ikPreview,
    lookAtSession,
    lookAtPreview,
    displayProject: lookAtPreview.project
  };
}
