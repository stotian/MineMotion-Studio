import type { AudioClip } from "./AudioTypes";

export function findClipsStartingAtFrame(
  clips: AudioClip[],
  frame: number,
  previousFrame: number
): AudioClip[] {
  return clips.filter(
    (clip) => clip.startFrame > previousFrame && clip.startFrame <= frame
  );
}
