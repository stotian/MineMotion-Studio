import { useCallback, useEffect, useMemo, useState } from "react";
import type { MineMotionProject } from "../../project/ProjectFile";
import {
  createLookAtControl,
  sanitizeLookAtControl,
  type LookAtControl
} from "./LookAtControl";
import {
  listLookAtTargets,
  resolveLookAtSubject
} from "./LookAtMapping";

export type LookAtControlPatch = Partial<Pick<
  LookAtControl,
  "targetId" | "targetPosition" | "enabled" | "influence" | "maxAngle"
>>;

export interface LookAtSession {
  control: LookAtControl | null;
  targets: readonly { id: string; name: string; type: string }[];
  updateControl: (patch: LookAtControlPatch) => void;
}

export function useLookAtSession(
  project: MineMotionProject,
  selectedObjectId: string | null
): LookAtSession {
  const subject = useMemo(
    () => resolveLookAtSubject(project, selectedObjectId),
    [project, selectedObjectId]
  );
  const targets = useMemo(
    () => subject ? listLookAtTargets(project, subject.id) : [],
    [project, subject]
  );
  const sessionKey = subject ? `${subject.kind}:${subject.id}` : "none";
  const createDefault = useCallback(
    () => subject
      ? createLookAtControl(subject, targets[0]?.id ?? null)
      : null,
    [subject, targets]
  );
  const [state, setState] = useState<{
    key: string;
    control: LookAtControl | null;
  }>(() => ({ key: sessionKey, control: createDefault() }));

  useEffect(() => {
    if (state.key === sessionKey) return;
    setState({ key: sessionKey, control: createDefault() });
  }, [createDefault, sessionKey, state.key]);

  const currentControl = state.key === sessionKey
    ? state.control
    : createDefault();
  const updateControl = useCallback((patch: LookAtControlPatch) => {
    setState((current) => {
      if (!current.control) return current;
      const control = sanitizeLookAtControl({
        ...current.control,
        ...patch,
        subject: current.control.subject
      });
      return control ? { ...current, control } : current;
    });
  }, []);

  return {
    control: currentControl,
    targets,
    updateControl
  };
}
