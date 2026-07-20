import { useCallback, useEffect, useMemo, useState } from "react";
import type { MineMotionProject } from "../../project/ProjectFile";
import { getSelectedCharacterId } from "../RigSelection";
import { sanitizeRigIKControls, type RigIKControl } from "./IKControl";
import { createRigIKControlsForCharacter } from "./RigIKMapping";

export interface RigIKSession {
  characterId: string | null;
  controls: readonly RigIKControl[];
  updateControl: (controlId: string, patch: Partial<RigIKControl>) => void;
}

export function useRigIKSession(
  project: MineMotionProject,
  selectedObjectId: string | null
): RigIKSession {
  const character = useMemo(() => {
    const selectedCharacterId = getSelectedCharacterId(selectedObjectId);
    return project.scene.characters.find((entry) => entry.id === selectedCharacterId) ??
      project.scene.characters[0] ?? null;
  }, [project.scene.characters, selectedObjectId]);
  const sessionKey = character
    ? `${character.id}:${character.rigPreset}:${Object.keys(character.boneRotations).sort().join(",")}`
    : "none";
  const [state, setState] = useState(() => ({
    key: sessionKey,
    controls: character ? createRigIKControlsForCharacter(character) : []
  }));

  useEffect(() => {
    if (state.key === sessionKey) return;
    setState({
      key: sessionKey,
      controls: character ? createRigIKControlsForCharacter(character) : []
    });
  }, [character, sessionKey, state.key]);

  const updateControl = useCallback((controlId: string, patch: Partial<RigIKControl>) => {
    setState((current) => ({
      ...current,
      controls: sanitizeRigIKControls(current.controls.map((control) =>
        control.id === controlId ? { ...control, ...patch } : control
      ))
    }));
  }, []);

  return {
    characterId: character?.id ?? null,
    controls: state.key === sessionKey ? state.controls : character ? createRigIKControlsForCharacter(character) : [],
    updateControl
  };
}
