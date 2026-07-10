import type { MineMotionProject, Vector3Tuple } from "../project/ProjectFile";
import type { RigAnimationClip } from "./RigTypes";

export const RIG_ANIMATION_PRESETS: RigAnimationClip[] = [
  clip("idle-breathing", "Idle Breathing", "Subtle head/body breathing loop.", 48, true, [
    [0, { body: [0, 0, 0], head: [0, 0, 0] }],
    [24, { body: [1.5, 0, 0], head: [-1, 0, 0] }],
    [48, { body: [0, 0, 0], head: [0, 0, 0] }]
  ]),
  clip("walk-cycle", "Walk Cycle", "Looping Minecraft walk cycle.", 32, true, [
    [0, { leftArm: [28, 0, -8], rightArm: [-28, 0, 8], leftLeg: [-28, 0, 0], rightLeg: [28, 0, 0] }],
    [16, { leftArm: [-28, 0, -8], rightArm: [28, 0, 8], leftLeg: [28, 0, 0], rightLeg: [-28, 0, 0] }],
    [32, { leftArm: [28, 0, -8], rightArm: [-28, 0, 8], leftLeg: [-28, 0, 0], rightLeg: [28, 0, 0] }]
  ]),
  clip("run-cycle", "Run Cycle", "Looping larger stride run cycle.", 24, true, [
    [0, { leftArm: [48, 0, -10], rightArm: [-48, 0, 10], leftLeg: [-42, 0, 0], rightLeg: [42, 0, 0], body: [8, 0, 0] }],
    [12, { leftArm: [-48, 0, -10], rightArm: [48, 0, 10], leftLeg: [42, 0, 0], rightLeg: [-42, 0, 0], body: [8, 0, 0] }],
    [24, { leftArm: [48, 0, -10], rightArm: [-48, 0, 10], leftLeg: [-42, 0, 0], rightLeg: [42, 0, 0], body: [8, 0, 0] }]
  ]),
  clip("sword-swing", "Sword Swing Placeholder", "Three-key sword swing arc.", 28, false, [
    [0, { rightArm: [-94, 12, 24], body: [0, -18, 0], head: [-6, -16, 0] }],
    [12, { rightArm: [-36, -18, -46], body: [0, 22, 0], head: [-8, 18, 0] }],
    [28, { rightArm: [0, 0, 8], body: [0, 0, 0], head: [0, 0, 0] }]
  ]),
  clip("hit-reaction", "Hit Reaction", "Short recoil animation.", 20, false, [
    [0, { body: [0, 0, 0], head: [0, 0, 0] }],
    [8, { body: [-14, 0, 0], head: [-20, 0, 0], leftArm: [-36, 0, -18], rightArm: [-36, 0, 18] }],
    [20, { body: [0, 0, 0], head: [0, 0, 0], leftArm: [0, 0, -8], rightArm: [0, 0, 8] }]
  ]),
  clip("camera-ready-turnaround", "Camera-Ready Turn-Around", "Body/head turn for hero reveals.", 72, false, [
    [0, { root: [0, -45, 0], head: [0, 22, 0] }],
    [36, { root: [0, 0, 0], head: [0, 0, 0] }],
    [72, { root: [0, 45, 0], head: [0, -22, 0] }]
  ]),
  clip("head-look-around", "Head Look Around", "Character scans left and right.", 72, true, [
    [0, { head: [0, 0, 0] }],
    [24, { head: [0, 35, 0] }],
    [48, { head: [0, -35, 0] }],
    [72, { head: [0, 0, 0] }]
  ]),
  clip("jump-land", "Jump/Land", "Jump anticipation and landing beat.", 48, false, [
    [0, { body: [12, 0, 0], leftLeg: [-24, 0, 0], rightLeg: [-24, 0, 0] }],
    [18, { body: [-8, 0, 0], leftArm: [-44, 0, -16], rightArm: [-44, 0, 16], leftLeg: [24, 0, -4], rightLeg: [16, 0, 4] }],
    [36, { body: [14, 0, 0], leftLeg: [-28, 0, -6], rightLeg: [-28, 0, 6] }],
    [48, { body: [0, 0, 0], leftArm: [0, 0, -8], rightArm: [0, 0, 8], leftLeg: [0, 0, 0], rightLeg: [0, 0, 0] }]
  ])
];

export function applyRigAnimationPreset(
  project: MineMotionProject,
  targetId: string,
  clipId: string
): MineMotionProject {
  const clipDefinition = RIG_ANIMATION_PRESETS.find((candidate) => candidate.id === clipId);
  const character = project.scene.characters.find((item) => item.id === targetId);
  if (!clipDefinition || !character) return project;

  const startFrame = project.animation.currentFrame;
  const tracks = [...project.animation.tracks];

  for (const keyframe of clipDefinition.keyframes) {
    for (const [boneId, rotation] of Object.entries(keyframe.boneRotations)) {
      const property = `bone.rotation.${boneId}` as const;
      const trackId = `${targetId}:${property}`;
      const frame = startFrame + keyframe.frame;
      const existingIndex = tracks.findIndex((track) => track.id === trackId);
      const nextKeyframe = { frame, value: [...rotation] as Vector3Tuple };
      if (existingIndex === -1) {
        tracks.push({
          id: trackId,
          targetId,
          property,
          keyframes: [nextKeyframe]
        });
      } else {
        const existing = tracks[existingIndex];
        const keyframes = existing.keyframes.filter((item) => item.frame !== frame);
        keyframes.push(nextKeyframe);
        tracks[existingIndex] = {
          ...existing,
          keyframes: keyframes.sort((a, b) => a.frame - b.frame)
        };
      }
    }
  }

  return {
    ...project,
    animation: {
      ...project.animation,
      durationFrames: Math.max(
        project.animation.durationFrames,
        startFrame + clipDefinition.durationFrames
      ),
      tracks
    },
    rigs: {
      ...project.rigs,
      animationClips: mergeClip(project.rigs.animationClips, clipDefinition)
    }
  };
}

function clip(
  id: string,
  name: string,
  description: string,
  durationFrames: number,
  loop: boolean,
  frames: Array<[number, RigAnimationClip["keyframes"][number]["boneRotations"]]>
): RigAnimationClip {
  return {
    id,
    name,
    description,
    durationFrames,
    loop,
    keyframes: frames.map(([frame, boneRotations]) => ({ frame, boneRotations }))
  };
}

function mergeClip(clips: RigAnimationClip[], clipDefinition: RigAnimationClip): RigAnimationClip[] {
  return clips.some((candidate) => candidate.id === clipDefinition.id)
    ? clips
    : [...clips, clipDefinition];
}
