import { useCallback, useEffect, useMemo, useState } from "react";
import type { MineMotionProject } from "../../project/ProjectFile";
import { findObject } from "../../project/ProjectStore";
import { parseRigBoneSelection } from "../RigSelection";
import {
  sampleProjectMotionPath,
  type MotionPathKind,
  type MotionPathSampleResult,
  type SampledMotionPath
} from "./MotionPathSampler";

export interface MotionPathControl {
  kind: MotionPathKind;
  subjectId: string;
  startFrame: number;
  endFrame: number;
  visible: boolean;
}

export interface MotionPathOption {
  key: string;
  kind: MotionPathKind;
  subjectId: string;
  name: string;
}

export type MotionPathControlPatch = Partial<MotionPathControl>;

export interface MotionPathSession {
  control: MotionPathControl | null;
  options: readonly MotionPathOption[];
  path: SampledMotionPath | null;
  error: string | null;
  updateControl: (patch: MotionPathControlPatch) => void;
}

export function useMotionPathSession(
  project: MineMotionProject,
  selectedObjectId: string | null
): MotionPathSession {
  const options = useMemo(
    () => createMotionPathOptions(project),
    [project.scene.cameras, project.scene.characters]
  );
  const preferred = useMemo(
    () => resolvePreferredOption(project, selectedObjectId, options),
    [
      options,
      project.scene.cameras,
      project.scene.characters,
      selectedObjectId
    ]
  );
  const pathProject = useMemo(
    () => project,
    [
      project.animation.durationFrames,
      project.animation.fps,
      project.animation.clips,
      project.animation.nlaTracks,
      project.animation.tracks,
      project.scene.cameras,
      project.scene.characters
    ]
  );
  const sessionKey = preferred
    ? `${preferred.key}:${project.animation.durationFrames}`
    : `none:${project.animation.durationFrames}`;
  const createDefault = useCallback(
    () => preferred ? {
      kind: preferred.kind,
      subjectId: preferred.subjectId,
      startFrame: 0,
      endFrame: project.animation.durationFrames,
      visible: false
    } satisfies MotionPathControl : null,
    [preferred, project.animation.durationFrames]
  );
  const [state, setState] = useState<{
    key: string;
    control: MotionPathControl | null;
  }>(() => ({ key: sessionKey, control: createDefault() }));

  useEffect(() => {
    if (state.key === sessionKey) return;
    setState({ key: sessionKey, control: createDefault() });
  }, [createDefault, sessionKey, state.key]);

  const control = state.key === sessionKey ? state.control : createDefault();
  const result = useMemo<MotionPathSampleResult | null>(() => {
    if (!control?.visible) return null;
    return sampleProjectMotionPath(pathProject, control);
  }, [control, pathProject]);
  const updateControl = useCallback((patch: MotionPathControlPatch) => {
    setState((current) => {
      if (!current.control) return current;
      const next = sanitizeControl(
        { ...current.control, ...patch },
        project.animation.durationFrames,
        options
      );
      return next ? { ...current, control: next } : current;
    });
  }, [options, project.animation.durationFrames]);

  return {
    control,
    options,
    path: result?.ok ? result.path : null,
    error: result && !result.ok ? result.error : null,
    updateControl
  };
}

function createMotionPathOptions(
  project: MineMotionProject
): MotionPathOption[] {
  return [
    ...project.scene.characters.flatMap((character) => [
      option("characterRoot", character.id, character.name),
      option("leftHand", character.id, character.name),
      option("rightHand", character.id, character.name)
    ]),
    ...project.scene.cameras.map((camera) =>
      option("camera", camera.id, camera.name)
    )
  ];
}

function resolvePreferredOption(
  project: MineMotionProject,
  selectedObjectId: string | null,
  options: readonly MotionPathOption[]
): MotionPathOption | null {
  const bone = parseRigBoneSelection(selectedObjectId);
  if (bone) {
    const kind = bone.boneId.includes("leftArm") || bone.boneId === "leftForearm"
      ? "leftHand"
      : bone.boneId.includes("rightArm") || bone.boneId === "rightForearm"
        ? "rightHand"
        : "characterRoot";
    return options.find((entry) =>
      entry.subjectId === bone.characterId && entry.kind === kind
    ) ?? options[0] ?? null;
  }
  const lookup = findObject(project, selectedObjectId);
  if (lookup?.entity.type === "character") {
    return options.find((entry) =>
      entry.subjectId === lookup.entity.id && entry.kind === "characterRoot"
    ) ?? options[0] ?? null;
  }
  if (lookup?.entity.type === "camera") {
    return options.find((entry) =>
      entry.subjectId === lookup.entity.id && entry.kind === "camera"
    ) ?? options[0] ?? null;
  }
  return options[0] ?? null;
}

function sanitizeControl(
  value: MotionPathControl,
  durationFrames: number,
  options: readonly MotionPathOption[]
): MotionPathControl | null {
  const optionEntry = options.find((entry) =>
    entry.kind === value.kind && entry.subjectId === value.subjectId
  );
  if (!optionEntry ||
    !Number.isFinite(value.startFrame) ||
    !Number.isFinite(value.endFrame)) {
    return null;
  }
  const startFrame = Math.min(
    durationFrames,
    Math.max(0, Math.round(value.startFrame))
  );
  const endFrame = Math.min(
    durationFrames,
    Math.max(startFrame, Math.round(value.endFrame))
  );
  return {
    kind: optionEntry.kind,
    subjectId: optionEntry.subjectId,
    startFrame,
    endFrame,
    visible: value.visible === true
  };
}

function option(
  kind: MotionPathKind,
  subjectId: string,
  name: string
): MotionPathOption {
  return { key: `${kind}|${subjectId}`, kind, subjectId, name };
}
