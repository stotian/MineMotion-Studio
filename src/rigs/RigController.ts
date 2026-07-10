import type { MineMotionProject, Vector3Tuple } from "../project/ProjectFile";
import type { MinecraftCharacterRig } from "./MinecraftCharacterRig";
import { clampFrame } from "../animation/Timeline";
import { updateBoneRotation } from "./RigInstance";

export class RigController {
  constructor(private readonly rig: MinecraftCharacterRig) {}

  setBoneRotation(boneId: string, rotation: Vector3Tuple): MinecraftCharacterRig {
    return {
      ...this.rig,
      character: updateBoneRotation(this.rig.character, boneId, rotation)
    };
  }
}

export function updateProjectBoneRotation(
  project: MineMotionProject,
  characterId: string,
  boneId: string,
  rotation: Vector3Tuple
): MineMotionProject {
  return {
    ...project,
    scene: {
      ...project.scene,
      characters: project.scene.characters.map((character) =>
        character.id === characterId
          ? updateBoneRotation(character, boneId, rotation)
          : character
      )
    }
  };
}

export function addBoneRotationKeyframe(
  project: MineMotionProject,
  characterId: string,
  boneId: string,
  frame = project.animation.currentFrame
): MineMotionProject {
  const character = project.scene.characters.find((item) => item.id === characterId);
  if (!character) return project;

  const safeFrame = clampFrame(project.animation, frame);
  const rotation = character.boneRotations[boneId] ?? [0, 0, 0];
  const property = `bone.rotation.${boneId}` as const;
  const trackId = `${characterId}:${property}`;
  const tracks = [...project.animation.tracks];
  const trackIndex = tracks.findIndex((track) => track.id === trackId);
  const keyframe = { frame: safeFrame, value: [...rotation] as Vector3Tuple };

  if (trackIndex === -1) {
    tracks.push({
      id: trackId,
      targetId: characterId,
      property,
      keyframes: [keyframe]
    });
  } else {
    const track = tracks[trackIndex];
    const keyframes = track.keyframes.filter((item) => item.frame !== safeFrame);
    keyframes.push(keyframe);
    tracks[trackIndex] = {
      ...track,
      keyframes: keyframes.sort((a, b) => a.frame - b.frame)
    };
  }

  return {
    ...project,
    scene: {
      ...project.scene,
      characters: project.scene.characters.map((item) =>
        item.id === characterId
          ? {
              ...item,
              selectedBoneId: boneId,
              boneKeyframes: upsertCharacterBoneKeyframe(
                item.boneKeyframes ?? [],
                boneId,
                safeFrame,
                rotation
              )
            }
          : item
      )
    },
    animation: {
      ...project.animation,
      tracks
    }
  };
}

function upsertCharacterBoneKeyframe(
  tracks: NonNullable<MineMotionProject["scene"]["characters"][number]["boneKeyframes"]>,
  boneId: string,
  frame: number,
  rotation: Vector3Tuple
) {
  const trackId = `bone:${boneId}`;
  const existing = tracks.find((track) => track.id === trackId);
  if (!existing) {
    return [
      ...tracks,
      {
        id: trackId,
        boneId,
        keyframes: [{ frame, rotation: [...rotation] as Vector3Tuple, interpolation: "linear" as const }]
      }
    ];
  }

  return tracks.map((track) => {
    if (track.id !== trackId) return track;
    const keyframes = track.keyframes.filter((item) => item.frame !== frame);
    keyframes.push({
      frame,
      rotation: [...rotation] as Vector3Tuple,
      interpolation: "linear"
    });
    return {
      ...track,
      keyframes: keyframes.sort((a, b) => a.frame - b.frame)
    };
  });
}
